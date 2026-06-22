import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminScreensTab from '@/components/AdminScreensTab';
import Icon from '@/components/ui/icon';
import { getSupplierSystems, saveSupplierSystem, getCatalogHierarchy, addProduct, updateProductPrice, deleteProduct } from '@/lib/api';

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
  { value: 'mount',              label: 'Крепёж / подвесы'    },
  { value: 'power_inlet',        label: 'Токовводы'           },
  { value: 'driver',             label: 'Блоки питания'       },
  { value: 'controller',         label: 'Контроллеры'         },
  { value: 'base',               label: 'Базы / адаптеры'     },
  { value: 'accessory',          label: 'Аксессуары'          },
];

// Иконки категорий (эмодзи как плейсхолдеры)
const CAT_EMOJI: Record<string, string> = {
  track: '📏', head: '💡', connector_straight: '➡️', connector_angle: '↩️',
  connector_flexible: '〰️', end_cap: '🔲', mount: '🔗', power_inlet: '🔌',
  driver: '⚡', controller: '🎛️', base: '🔧', accessory: '📦',
};

type SystemDef = { name: string; types: string[]; voltage: string; wires: string };
type SupplierDef = { code: string; name: string; color: string; logo: string; status: string; statusLabel: string; statusColor: string; systems: SystemDef[] };
interface Product  { id: number; article: string; name: string; category: string; voltage: number | null; unit: string; obsolete: boolean; price: number | null; stock_qty: number | null }
interface Category { key: string; label: string; products: Product[] }
interface Series   { id: number; name: string; voltage: number | null; product_count: number; categories: Category[] }
interface Supplier { id: number; code: string; name: string; series: Series[] }

const SUPPLIER_COLORS: Record<string, string> = { arlight: '#3d5afe' };
const ARLIGHT_LOGO = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/67102236-293c-4925-b47f-e13686e93b7e.jpg';

const SUPPLIERS_DEFAULT: SupplierDef[] = [
  {
    code: 'arlight', name: 'Arlight', color: '#3d5afe', logo: ARLIGHT_LOGO,
    status: 'waiting', statusLabel: 'Ожидает доступ из ЛК', statusColor: '#f59e0b',
    systems: [
      { name: 'TRACK-4TR (220В)', types: ['surface', 'harpoon'],  voltage: '220В', wires: '4-проводная' },
      { name: 'MAG-45 (48В)',     types: ['surface', 'built_in'], voltage: '48В',  wires: 'Маломощная'  },
      { name: 'MAG-20 (24В)',     types: ['surface'],             voltage: '24В',  wires: 'Компактная'  },
    ],
  },
];

const TABS = [
  { key: 'screens',    label: 'Экраны',     icon: 'Image'     },
  { key: 'suppliers',  label: 'Поставщики', icon: 'Building2' },
  { key: 'categories', label: 'Системы',    icon: 'Layers'    },
  { key: 'products',   label: 'Товары',     icon: 'Package'   },
];

// ─── Поставщики ───────────────────────────────────────────────────────────────
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

  if (loading) return <div className="text-center py-16 text-white/20 text-sm animate-pulse">Загружаю...</div>;

  return (
    <div>
      {suppliers.map(s => (
        <div key={s.code}>
          {/* Шапка поставщика */}
          <div className="flex items-center gap-5 py-6 border-b border-white/8">
            <img src={s.logo} alt={s.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
            <div className="flex-1">
              <div className="text-2xl font-black text-white">{s.name}</div>
              <div className="text-sm text-white/40 mt-1">{s.systems.length} системы в каталоге</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ backgroundColor: `${s.statusColor}20`, color: s.statusColor }}>
              {s.statusLabel}
            </span>
          </div>

          {/* Системы */}
          {s.systems.map((sys, sysIdx) => (
            <div key={sysIdx} className="py-5 border-b border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-base font-bold text-white">{sys.name}</div>
                <span className="text-xs px-2 py-0.5 rounded font-semibold text-[var(--neon)] bg-[var(--neon)]/10">{sys.voltage}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_MOUNT_TYPES.map(mt => {
                  const active = sys.types.includes(mt.id);
                  return (
                    <button key={mt.id} onClick={() => toggleType(s.code, sysIdx, mt.id)}
                      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-all ${
                        active
                          ? 'bg-[var(--neon)]/15 text-[var(--neon)] border border-[var(--neon)]/40'
                          : 'bg-white/5 text-white/35 border border-transparent hover:text-white/60 hover:bg-white/8'
                      }`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-[var(--neon)]' : 'bg-white/10'}`}>
                        {active && <Icon name="Check" size={10} className="text-white" />}
                      </div>
                      {mt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {s.status === 'waiting' && (
            <div className="flex items-center gap-2 py-4 text-amber-400/70">
              <Icon name="Clock" size={14} className="flex-shrink-0" />
              <span className="text-sm">Ожидаем доступ из ЛК. После получения — загрузите прайс и остатки во вкладке «Товары».</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Системы ─────────────────────────────────────────────────────────────────
function SystemsTab({ onDrillDown }: { onDrillDown: (supplierId: number, seriesId: number) => void }) {
  const [catalog, setCatalog] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCatalogHierarchy().then(d => { setCatalog(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-16 text-white/20 text-sm animate-pulse">Загружаю...</div>;

  return (
    <div>
      {catalog.map(sup => (
        <div key={sup.id}>
          {/* Шапка поставщика */}
          <div className="flex items-center gap-5 py-6 border-b border-white/8">
            <img src={ARLIGHT_LOGO} alt={sup.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
            <div>
              <div className="text-2xl font-black text-white">{sup.name}</div>
              <div className="text-sm text-white/40 mt-1">{sup.series.reduce((s, sr) => s + sr.product_count, 0)} товаров</div>
            </div>
          </div>

          {/* Системы */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
            {sup.series.map(series => (
              <button key={series.id} onClick={() => onDrillDown(sup.id, series.id)}
                className="group text-left p-5 rounded-2xl bg-white/4 hover:bg-[var(--neon)]/10 border border-white/6 hover:border-[var(--neon)]/30 transition-all">
                <div className="text-3xl mb-3">🔆</div>
                <div className="font-bold text-white text-base group-hover:text-[var(--neon)] transition-colors">{series.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  {series.voltage && (
                    <span className="text-xs px-2 py-0.5 rounded font-semibold text-[var(--neon)] bg-[var(--neon)]/10">{series.voltage}В</span>
                  )}
                  <span className="text-xs text-white/30">{series.product_count} поз.</span>
                </div>
                <div className="mt-3 text-white/25 text-xs group-hover:text-[var(--neon)]/60 transition-colors flex items-center gap-1">
                  Открыть товары <Icon name="ArrowRight" size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Товары ───────────────────────────────────────────────────────────────────
function ProductsTab({ initSeriesId }: { initSeriesId?: number }) {
  const [catalog, setCatalog] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSup, setSelectedSup] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(initSeriesId ?? null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [addingForm, setAddingForm] = useState(false);
  const [form, setForm] = useState({ article: '', name: '', category: 'track', voltage: '', unit: 'шт', price: '' });
  const [saving, setSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [priceVal, setPriceVal] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = () => {
    setLoading(true);
    getCatalogHierarchy().then(d => {
      setCatalog(d);
      if (initSeriesId) {
        const sup = d.find((s: Supplier) => s.series.some((sr: Series) => sr.id === initSeriesId));
        if (sup) setSelectedSup(sup.id);
      }
      setLoading(false);
    });
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

  const handleDelete = async (id: number) => { await deleteProduct(id); load(); };
  const savePrice = async (id: number) => { await updateProductPrice(id, Number(priceVal)); setEditingPrice(null); load(); };

  const inp = "bg-white/6 border-0 text-white rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/50 placeholder:text-white/25 w-full";

  if (loading) return <div className="text-center py-16 text-white/20 text-sm animate-pulse">Загружаю...</div>;

  return (
    <div className="space-y-4">

      {/* Поставщики */}
      <div className="flex gap-2">
        {catalog.map(sup => (
          <button key={sup.id}
            onClick={() => { setSelectedSup(sup.id); setSelectedSeries(null); setSelectedCat(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedSup === sup.id ? 'bg-[var(--neon)] text-white' : 'bg-white/6 text-white/50 hover:text-white hover:bg-white/10'
            }`}>
            <img src={ARLIGHT_LOGO} alt="" className="w-5 h-5 rounded object-cover" />
            {sup.name}
          </button>
        ))}
      </div>

      {/* Системы */}
      {selectedSup && (
        <div className="flex flex-wrap gap-2">
          {catalog.find(s => s.id === selectedSup)?.series.map(sr => (
            <button key={sr.id}
              onClick={() => { setSelectedSeries(sr.id); setSelectedCat(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedSeries === sr.id ? 'bg-white/15 text-white border border-white/20' : 'bg-white/4 text-white/40 hover:text-white/70 hover:bg-white/8'
              }`}>
              {sr.name}
              <span className="ml-2 text-xs opacity-50">{sr.product_count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Категории */}
      {selectedSeries && (
        <div className="flex flex-wrap gap-2">
          {currentSeries?.categories.map(cat => (
            <button key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                selectedCat === cat.key ? 'bg-white/15 text-white' : 'bg-white/4 text-white/40 hover:text-white/70 hover:bg-white/7'
              }`}>
              <span>{CAT_EMOJI[cat.key] ?? '📦'}</span>
              {cat.label}
              <span className="text-xs opacity-50">{cat.products.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Таблица товаров */}
      {selectedCat && (
        <div>
          {/* Заголовок */}
          <div className="flex items-center gap-3 py-4 border-b border-white/8">
            <span className="text-xl">{CAT_EMOJI[selectedCat] ?? '📦'}</span>
            <span className="text-lg font-bold text-white">{currentCat?.label}</span>
            <span className="text-sm text-white/30">{products.length} позиций</span>
            <button onClick={() => setAddingForm(p => !p)}
              className="ml-auto flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[var(--neon)]/15 text-[var(--neon)] hover:bg-[var(--neon)]/25 transition-all font-medium">
              <Icon name="Plus" size={14} /> Добавить
            </button>
          </div>

          {/* Форма добавления */}
          {addingForm && (
            <div className="py-4 border-b border-white/8 grid grid-cols-2 gap-3">
              <input value={form.article} onChange={e => setForm(p => ({...p, article: e.target.value}))} placeholder="Артикул *" className={inp} />
              <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Название *" className={inp} />
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={inp + ' col-span-1'}>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>)}
              </select>
              <div className="flex gap-2">
                <input value={form.voltage} onChange={e => setForm(p => ({...p, voltage: e.target.value}))} placeholder="В" className="bg-white/6 border-0 text-white rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/50 placeholder:text-white/25 w-20" />
                <input value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))} placeholder="ед." className="bg-white/6 border-0 text-white rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/50 placeholder:text-white/25 w-20" />
                <input value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="Цена ₽" className="bg-white/6 border-0 text-white rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/50 placeholder:text-white/25 flex-1" />
              </div>
              <div className="col-span-2 flex gap-2">
                <button onClick={handleAdd} disabled={saving || !form.article || !form.name}
                  className="neon-btn text-white text-sm px-5 py-2 rounded-xl font-semibold disabled:opacity-40">
                  {saving ? 'Сохраняю...' : 'Добавить товар'}
                </button>
                <button onClick={() => setAddingForm(false)} className="text-white/30 text-sm hover:text-white px-3 transition-colors">Отмена</button>
              </div>
            </div>
          )}

          {/* Шапка таблицы */}
          <div className="flex items-center gap-4 py-2.5 text-xs text-white/25 uppercase tracking-wider">
            <span className="w-36 flex-shrink-0">Артикул</span>
            <span className="flex-1">Название</span>
            <span className="w-10 text-right">Ед.</span>
            <span className="w-28 text-right">Цена</span>
            <span className="w-6" />
          </div>

          {products.length === 0 && (
            <div className="py-12 text-center text-white/20 text-sm">Нет товаров в этой категории</div>
          )}

          {products.map(p => (
            <div key={p.id} className="flex items-center gap-4 py-3 border-t border-white/5 group hover:bg-white/2 rounded-lg -mx-2 px-2 transition-colors">
              <span className="font-mono text-white/35 text-xs w-36 flex-shrink-0 truncate">{p.article}</span>
              <span className="flex-1 text-white text-sm truncate">{p.name}</span>
              <span className="text-white/30 text-xs w-10 text-right flex-shrink-0">{p.unit}</span>
              {editingPrice === p.id ? (
                <div className="flex items-center gap-1.5 w-28 justify-end">
                  <input autoFocus value={priceVal} onChange={e => setPriceVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && savePrice(p.id)}
                    className="w-20 bg-white/10 text-white text-sm px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/50" />
                  <button onClick={() => savePrice(p.id)} className="text-[var(--neon)] hover:opacity-70"><Icon name="Check" size={14} /></button>
                  <button onClick={() => setEditingPrice(null)} className="text-white/20 hover:text-white"><Icon name="X" size={14} /></button>
                </div>
              ) : (
                <button onClick={() => { setEditingPrice(p.id); setPriceVal(String(p.price ?? '')); }}
                  className="w-28 text-right font-semibold text-white hover:text-[var(--neon)] transition-colors text-sm">
                  {p.price != null ? `${p.price.toLocaleString('ru')} ₽` : <span className="text-white/20 font-normal">— ₽</span>}
                </button>
              )}
              <button onClick={() => handleDelete(p.id)}
                className="w-6 opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all flex-shrink-0">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!selectedSup && (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">📦</div>
          <div className="text-white/30 text-sm">Выбери поставщика, систему и категорию</div>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".json" className="hidden" />
    </div>
  );
}

// ─── Главная ──────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'screens' | 'suppliers' | 'categories' | 'products'>('screens');
  const [drillSeriesId, setDrillSeriesId] = useState<number | undefined>();

  const handleDrillDown = (_supId: number, seriesId: number) => {
    setDrillSeriesId(seriesId);
    setTab('products');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/6 sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} /> Назад
        </button>
        <span className="text-lg font-black text-white">Настройки</span>

        {/* Табы в хедере */}
        <div className="ml-8 flex gap-1 bg-white/5 p-1 rounded-2xl">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-[var(--neon)] text-white shadow-[0_0_16px_rgba(61,90,254,0.4)]' : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {tab === 'screens'    && <AdminScreensTab />}
        {tab === 'suppliers'  && <SuppliersTab />}
        {tab === 'categories' && <SystemsTab onDrillDown={handleDrillDown} />}
        {tab === 'products'   && <ProductsTab initSeriesId={drillSeriesId} />}
      </div>
    </div>
  );
}
