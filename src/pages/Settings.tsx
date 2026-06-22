import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminScreensTab from '@/components/AdminScreensTab';
import Icon from '@/components/ui/icon';
import { getSupplierSystems, saveSupplierSystem, getCatalogHierarchy, addProduct, updateProductPrice, deleteProduct } from '@/lib/api';

// ─── Типы ────────────────────────────────────────────────────────────────────
const ALL_MOUNT_TYPES = [
  { id: 'surface',  label: 'Универсальные'    },
  { id: 'harpoon',  label: 'Гарпунные'        },
  { id: 'other',    label: 'На поверхность'   },
  { id: 'built_in', label: 'Для гипсокартона' },
];

const CATEGORY_OPTIONS = [
  { value: 'track',              label: 'Шинопровод'          },
  { value: 'head',               label: 'Светильники'         },
  { value: 'connector_straight', label: 'Соединители прямые'  },
  { value: 'connector_angle',    label: 'Соединители угловые' },
  { value: 'connector_flexible', label: 'Соединители гибкие'  },
  { value: 'end_cap',            label: 'Заглушки'            },
  { value: 'mount',              label: 'Крепёж / подвесы'   },
  { value: 'power_inlet',        label: 'Токовводы'          },
  { value: 'driver',             label: 'Блоки питания'       },
  { value: 'controller',         label: 'Контроллеры'        },
  { value: 'base',               label: 'Базы / адаптеры'     },
  { value: 'accessory',          label: 'Аксессуары'         },
];

type SystemDef = { name: string; types: string[]; voltage: string; wires: string };
type SupplierDef = { code: string; name: string; color: string; logo: string; status: string; statusLabel: string; statusColor: string; systems: SystemDef[] };

interface Product  { id: number; article: string; name: string; category: string; voltage: number | null; unit: string; obsolete: boolean; price: number | null; stock_qty: number | null }
interface Category { key: string; label: string; products: Product[] }
interface Series   { id: number; name: string; voltage: number | null; product_count: number; categories: Category[] }
interface Supplier { id: number; code: string; name: string; series: Series[] }

const SUPPLIER_COLORS: Record<string, string> = { arlight: '#3d5afe', ego: '#f59e0b' };

const SUPPLIERS_DEFAULT: SupplierDef[] = [
  {
    code: 'arlight', name: 'Arlight', color: '#3d5afe',
    logo: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/67102236-293c-4925-b47f-e13686e93b7e.jpg',
    status: 'waiting', statusLabel: 'Ожидает доступ из ЛК', statusColor: '#f59e0b',
    systems: [
      { name: 'TRACK-4TR (220В)', types: ['surface', 'harpoon'],  voltage: '220В', wires: '4-проводная' },
      { name: 'MAG-45 (48В)',     types: ['surface', 'built_in'], voltage: '48В',  wires: 'Маломощная'  },
      { name: 'MAG-20 (24В)',     types: ['surface'],             voltage: '24В',  wires: 'Компактная'  },
    ],
  },
];

const TABS = [
  { key: 'screens',    label: 'Экраны',          icon: 'Image'     },
  { key: 'suppliers',  label: 'Поставщики',       icon: 'Building2' },
  { key: 'categories', label: 'Категории',        icon: 'Tag'       },
  { key: 'products',   label: 'Товары',           icon: 'Package'   },
];

// ─── Вкладка Поставщики ───────────────────────────────────────────────────────
function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<SupplierDef[]>(SUPPLIERS_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupplierSystems().then(data => {
      if (Object.keys(data).length > 0) {
        setSuppliers(prev => prev.map(s => {
          const dbSup = data[s.code];
          if (!dbSup) return s;
          return { ...s, systems: s.systems.map((sys, i) => dbSup[i] ? { ...sys, types: dbSup[i].types } : sys) };
        }));
      }
      setLoading(false);
    });
  }, []);

  const toggleType = (supplierCode: string, sysIndex: number, typeId: string) => {
    setSuppliers(prev => {
      const next = prev.map(s => {
        if (s.code !== supplierCode) return s;
        return {
          ...s,
          systems: s.systems.map((sys, i) => {
            if (i !== sysIndex) return sys;
            const has = sys.types.includes(typeId);
            return { ...sys, types: has ? sys.types.filter(t => t !== typeId) : [...sys.types, typeId] };
          }),
        };
      });
      const sup = next.find(s => s.code === supplierCode)!;
      const sys = sup.systems[sysIndex];
      saveSupplierSystem({ supplier_code: supplierCode, system_index: sysIndex, system_name: sys.name, voltage: sys.voltage, wires: sys.wires, types: sys.types });
      return next;
    });
  };

  if (loading) return <div className="text-center py-12 text-white/30 text-sm animate-pulse">Загружаю настройки...</div>;

  return (
    <div className="space-y-4">
      <div className="pro-card p-4 flex items-start gap-3">
        <Icon name="Info" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-white/60 leading-relaxed">
          На шаге 5 клиент видит <strong className="text-white">все системы всех поставщиков</strong> для выбранного типа установки. Отметь галочками — какая система поддерживает какой тип монтажа.
        </div>
      </div>

      {suppliers.map(s => (
        <div key={s.code} className="pro-card overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]" style={{ background: `linear-gradient(135deg, ${s.color}10, transparent)` }}>
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0">
              <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white text-base">{s.name}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.systems.length} системы в каталоге</div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: `${s.statusColor}22`, color: s.statusColor, border: `1px solid ${s.statusColor}44` }}>
              {s.statusLabel}
            </span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {s.systems.map((sys, sysIdx) => (
              <div key={sysIdx} className="px-4 py-4">
                <div className="font-bold text-sm text-white mb-3">{sys.name}</div>
                <div className="flex flex-wrap gap-2">
                  {ALL_MOUNT_TYPES.map(mt => {
                    const active = sys.types.includes(mt.id);
                    return (
                      <button key={mt.id} onClick={() => toggleType(s.code, sysIdx, mt.id)}
                        className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          active ? 'border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]' : 'border-[var(--border)] text-white/30 hover:text-white/60 hover:border-white/30'
                        }`}>
                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all ${active ? 'border-[var(--neon)] bg-[var(--neon)]' : 'border-white/20'}`}>
                          {active && <Icon name="Check" size={8} className="text-white" />}
                        </div>
                        {mt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {s.status === 'waiting' && (
            <div className="px-4 py-3 bg-amber-500/5 border-t border-amber-500/20 flex items-center gap-2">
              <Icon name="Clock" size={13} className="text-amber-400 flex-shrink-0" />
              <span className="text-[11px] text-amber-400/80">Ожидаем доступ из ЛК. После получения — загрузите прайс и остатки во вкладке «Товары».</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Вкладка Категории ────────────────────────────────────────────────────────
function CategoriesTab({ onDrillDown }: { onDrillDown: (supplierId: number, seriesId: number, catKey: string) => void }) {
  const [catalog, setCatalog] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSeries, setOpenSeries] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getCatalogHierarchy().then(d => { setCatalog(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-12 text-white/30 text-sm animate-pulse">Загружаю каталог...</div>;

  return (
    <div className="space-y-4">
      <div className="pro-card p-4 flex items-start gap-3">
        <Icon name="Info" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-white/60 leading-relaxed">
          Структура каталога: <strong className="text-white">Поставщик → Система → Категория</strong>. Нажми на категорию чтобы перейти к товарам.
        </div>
      </div>

      {catalog.map(sup => (
        <div key={sup.id} className="pro-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]"
            style={{ background: `linear-gradient(135deg, ${SUPPLIER_COLORS[sup.code] ?? '#fff'}12, transparent)` }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SUPPLIER_COLORS[sup.code] ?? '#fff' }} />
            <span className="font-black text-white text-sm">{sup.name}</span>
            <span className="text-[10px] text-white/30 ml-1">{sup.series.reduce((s, sr) => s + sr.product_count, 0)} товаров</span>
          </div>

          {sup.series.map(series => (
            <div key={series.id} className="border-b border-[var(--border)] last:border-0">
              <button onClick={() => setOpenSeries(p => ({ ...p, [series.id]: !p[series.id] }))}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                <Icon name={openSeries[series.id] ? 'ChevronDown' : 'ChevronRight'} size={13} className="text-white/30" />
                <span className="font-bold text-sm text-white">{series.name}</span>
                {series.voltage && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${SUPPLIER_COLORS[sup.code]}22`, color: SUPPLIER_COLORS[sup.code] }}>
                    {series.voltage}В
                  </span>
                )}
                <span className="ml-auto text-[10px] text-white/30">{series.product_count} поз.</span>
              </button>

              {openSeries[series.id] && (
                <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {series.categories.map(cat => (
                    <button key={cat.key}
                      onClick={() => onDrillDown(sup.id, series.id, cat.key)}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--neon)] hover:bg-[var(--neon)]/5 transition-all text-left group">
                      <span className="text-xs text-white/70 group-hover:text-white font-medium truncate">{cat.label}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] text-white/30">{cat.products.length}</span>
                        <Icon name="ChevronRight" size={11} className="text-white/20 group-hover:text-[var(--neon)]" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Вкладка Товары ───────────────────────────────────────────────────────────
function ProductsTab({ initSeriesId, initCatKey }: { initSeriesId?: number; initCatKey?: string }) {
  const [catalog, setCatalog] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSup, setSelectedSup] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(initSeriesId ?? null);
  const [selectedCat, setSelectedCat] = useState<string | null>(initCatKey ?? null);
  const [addingForm, setAddingForm] = useState(false);
  const [form, setForm] = useState({ article: '', name: '', category: initCatKey ?? 'track', voltage: '', unit: 'шт', price: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getCatalogHierarchy().then(d => { setCatalog(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const currentSeries = catalog.flatMap(s => s.series).find(sr => sr.id === selectedSeries);
  const currentCat = currentSeries?.categories.find(c => c.key === selectedCat);
  const products = currentCat?.products ?? [];

  const handleAdd = async () => {
    if (!selectedSeries || !form.article || !form.name) return;
    setSaving(true);
    await addProduct({ series_id: selectedSeries, article: form.article, name: form.name, category: selectedCat ?? form.category, voltage: form.voltage ? Number(form.voltage) : undefined, unit: form.unit, price: form.price ? Number(form.price) : undefined });
    setSaving(false);
    setAddingForm(false);
    setForm(p => ({ ...p, article: '', name: '', voltage: '', price: '' }));
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    load();
  };

  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [priceVal, setPriceVal] = useState('');
  const savePrice = async (id: number) => {
    await updateProductPrice(id, Number(priceVal));
    setEditingPrice(null);
    load();
  };

  if (loading) return <div className="text-center py-12 text-white/30 text-sm animate-pulse">Загружаю...</div>;

  const inputCls = "bg-[var(--bg-primary)] border border-[var(--border)] text-white rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:border-[var(--neon)] placeholder:text-white/25";

  return (
    <div className="space-y-3">
      {/* Навигация: поставщик → серия → категория */}
      <div className="flex flex-wrap gap-2">
        {/* Поставщики */}
        <div className="flex gap-1.5">
          {catalog.map(sup => (
            <button key={sup.id}
              onClick={() => { setSelectedSup(sup.id); setSelectedSeries(null); setSelectedCat(null); }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${selectedSup === sup.id ? 'border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]' : 'border-[var(--border)] text-white/40 hover:text-white/70'}`}>
              {sup.name}
            </button>
          ))}
        </div>
      </div>

      {/* Серии */}
      {selectedSup && (
        <div className="flex flex-wrap gap-1.5">
          {catalog.find(s => s.id === selectedSup)?.series.map(sr => (
            <button key={sr.id}
              onClick={() => { setSelectedSeries(sr.id); setSelectedCat(null); }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${selectedSeries === sr.id ? 'border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]' : 'border-[var(--border)] text-white/30 hover:text-white/60'}`}>
              {sr.name}
              <span className="ml-1.5 text-[10px] opacity-60">{sr.product_count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Категории */}
      {selectedSeries && (
        <div className="flex flex-wrap gap-1.5">
          {currentSeries?.categories.map(cat => (
            <button key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${selectedCat === cat.key ? 'border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)]' : 'border-[var(--border)] text-white/30 hover:text-white/60'}`}>
              {cat.label}
              <span className="ml-1.5 text-[10px] opacity-60">{cat.products.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Товары */}
      {selectedCat && (
        <div className="pro-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <Icon name="Package" size={13} className="text-[var(--neon)]" />
            <span className="text-xs font-bold text-white">{currentCat?.label}</span>
            <span className="text-[10px] text-white/30">{products.length} позиций</span>
            <button onClick={() => setAddingForm(p => !p)}
              className="ml-auto flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-white/40 hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all">
              <Icon name="Plus" size={11} /> Добавить
            </button>
          </div>

          {/* Форма добавления */}
          {addingForm && (
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--neon)]/5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={form.article} onChange={e => setForm(p => ({...p, article: e.target.value}))} placeholder="Артикул *" className={inputCls} />
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Название *" className={inputCls} />
                <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={inputCls}>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-1.5">
                  <input value={form.voltage} onChange={e => setForm(p => ({...p, voltage: e.target.value}))} placeholder="В" className={`${inputCls} w-16`} />
                  <input value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))} placeholder="ед." className={`${inputCls} w-16`} />
                  <input value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="Цена ₽" className={`${inputCls} flex-1`} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={saving || !form.article || !form.name}
                  className="neon-btn text-white text-xs px-4 py-1.5 rounded-lg font-semibold disabled:opacity-40">
                  {saving ? 'Сохраняю...' : 'Добавить'}
                </button>
                <button onClick={() => setAddingForm(false)} className="text-white/30 text-xs hover:text-white px-2 transition-colors">Отмена</button>
              </div>
            </div>
          )}

          {/* Шапка таблицы */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <span className="text-[10px] text-white/30 w-28">Артикул</span>
            <span className="text-[10px] text-white/30 flex-1">Название</span>
            <span className="text-[10px] text-white/30 w-8 text-right">Ед.</span>
            <span className="text-[10px] text-white/30 w-24 text-right">Цена</span>
            <span className="w-6" />
          </div>

          {products.length === 0 && (
            <div className="text-center py-8 text-white/25 text-xs">Нет товаров в этой категории</div>
          )}

          {products.map(p => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)]/50 last:border-0 hover:bg-white/2 group text-xs">
              <span className="font-mono text-white/40 w-28 flex-shrink-0 truncate">{p.article}</span>
              <span className="flex-1 text-white/80 truncate">{p.name}</span>
              <span className="text-white/30 w-8 text-right flex-shrink-0">{p.unit}</span>
              {editingPrice === p.id ? (
                <div className="flex items-center gap-1 w-24 justify-end">
                  <input autoFocus value={priceVal} onChange={e => setPriceVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && savePrice(p.id)}
                    className="w-16 bg-[var(--bg-primary)] border border-[var(--neon)]/50 text-white text-xs px-2 py-0.5 rounded focus:outline-none" />
                  <button onClick={() => savePrice(p.id)} className="text-[var(--neon)]"><Icon name="Check" size={12} /></button>
                  <button onClick={() => setEditingPrice(null)} className="text-white/30"><Icon name="X" size={12} /></button>
                </div>
              ) : (
                <button onClick={() => { setEditingPrice(p.id); setPriceVal(String(p.price ?? '')); }}
                  className="w-24 text-right text-white/60 hover:text-[var(--neon)] transition-colors">
                  {p.price != null ? `${p.price.toLocaleString('ru')} ₽` : <span className="text-white/20">— ₽</span>}
                </button>
              )}
              <button onClick={() => handleDelete(p.id)}
                className="w-6 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all flex-shrink-0 text-right">
                <Icon name="Trash2" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!selectedSup && (
        <div className="pro-card p-10 text-center">
          <Icon name="Package" size={32} className="mx-auto mb-3 text-white/20" />
          <div className="text-sm text-white/40">Выбери поставщика, затем систему и категорию</div>
        </div>
      )}
    </div>
  );
}

// ─── Главная страница Settings ────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'screens' | 'suppliers' | 'categories' | 'products'>('screens');
  const [drillSeriesId, setDrillSeriesId] = useState<number | undefined>();
  const [drillCatKey, setDrillCatKey] = useState<string | undefined>();

  const handleDrillDown = (_supId: number, seriesId: number, catKey: string) => {
    setDrillSeriesId(seriesId);
    setDrillCatKey(catKey);
    setTab('products');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-white/50 hover:text-[var(--neon)] transition-colors">
          <Icon name="ArrowLeft" size={16} /> Назад
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--neon)] flex items-center justify-center shadow-[0_0_12px_var(--neon-glow)]">
            <Icon name="Settings" size={14} className="text-white" />
          </div>
          <span className="text-base font-black text-white">Настройки</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-[var(--neon)] text-white shadow-[0_0_12px_var(--neon-glow)]' : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={12} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'screens'    && <AdminScreensTab />}
        {tab === 'suppliers'  && <SuppliersTab />}
        {tab === 'categories' && <CategoriesTab onDrillDown={handleDrillDown} />}
        {tab === 'products'   && <ProductsTab initSeriesId={drillSeriesId} initCatKey={drillCatKey} />}
      </div>
    </div>
  );
}
