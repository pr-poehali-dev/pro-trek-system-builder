import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminScreensTab from '@/components/AdminScreensTab';
import Icon from '@/components/ui/icon';
import { getSupplierSystems, saveSupplierSystem, getCatalogHierarchy, addProduct, updateProductPrice, deleteProduct } from '@/lib/api';

// ─── Константы ────────────────────────────────────────────────────────────────
const ALL_MOUNT_TYPES = [
  { id: 'surface',  label: 'Универсальные'    },
  { id: 'harpoon',  label: 'Гарпунные'        },
  { id: 'other',    label: 'На поверхность'   },
  { id: 'built_in', label: 'Для гипсокартона' },
];

const ALL_CATEGORIES = [
  { key: 'track',              label: 'Шинопровод',          emoji: '📏' },
  { key: 'head',               label: 'Светильники',         emoji: '💡' },
  { key: 'connector_straight', label: 'Соединители прямые',  emoji: '➡️' },
  { key: 'connector_angle',    label: 'Соединители угловые', emoji: '↩️' },
  { key: 'connector_flexible', label: 'Соединители гибкие',  emoji: '〰️' },
  { key: 'end_cap',            label: 'Заглушки',            emoji: '🔲' },
  { key: 'mount',              label: 'Крепёж / подвесы',    emoji: '🔗' },
  { key: 'power_inlet',        label: 'Токовводы',           emoji: '🔌' },
  { key: 'driver',             label: 'Блоки питания',       emoji: '⚡' },
  { key: 'controller',         label: 'Контроллеры',         emoji: '🎛️' },
  { key: 'base',               label: 'Базы / адаптеры',     emoji: '🔧' },
  { key: 'accessory',          label: 'Аксессуары',          emoji: '📦' },
];

type SystemDef = { name: string; types: string[]; voltage: string; wires: string };
type SupplierDef = { code: string; name: string; color: string; logo: string; status: string; statusLabel: string; statusColor: string; systems: SystemDef[] };
interface Product  { id: number; article: string; name: string; category: string; voltage: number | null; unit: string; obsolete: boolean; price: number | null; stock_qty: number | null }
interface CatGroup { key: string; label: string; products: Product[] }
interface Series   { id: number; name: string; voltage: number | null; product_count: number; categories: CatGroup[] }
interface Supplier { id: number; code: string; name: string; series: Series[] }

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
  { key: 'screens',    label: 'Экраны',      icon: 'Image'     },
  { key: 'suppliers',  label: 'Поставщики',  icon: 'Building2' },
  { key: 'categories', label: 'Категории',   icon: 'Tag'       },
  { key: 'products',   label: 'Товары',      icon: 'Package'   },
];

const inputCls = "bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 placeholder:text-white/25 w-full";

// ─── Поставщики (с раскрывающимися системами) ─────────────────────────────────
function SuppliersTab({ onGoToCategories }: { onGoToCategories: (seriesName: string) => void }) {
  const [suppliers, setSuppliers] = useState<SupplierDef[]>(SUPPLIERS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({ arlight: true });
  const [dropOpen, setDropOpen] = useState<string | null>(null); // `${supplierCode}-${sysIdx}`

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

  const toggleType = (code: string, idx: number, typeId: string) => {
    setSuppliers(prev => {
      const next = prev.map(s => {
        if (s.code !== code) return s;
        return {
          ...s,
          systems: s.systems.map((sys, i) => {
            if (i !== idx) return sys;
            const has = sys.types.includes(typeId);
            return { ...sys, types: has ? sys.types.filter(t => t !== typeId) : [...sys.types, typeId] };
          }),
        };
      });
      const sup = next.find(s => s.code === code)!;
      const sys = sup.systems[idx];
      saveSupplierSystem({ supplier_code: code, system_index: idx, system_name: sys.name, voltage: sys.voltage, wires: sys.wires, types: sys.types });
      return next;
    });
  };

  if (loading) return <div className="py-16 text-center text-white/20 text-sm animate-pulse">Загружаю...</div>;

  return (
    <div className="space-y-1">
      {suppliers.map(s => (
        <div key={s.code}>
          {/* Строка поставщика */}
          <button
            onClick={() => setOpen(p => ({ ...p, [s.code]: !p[s.code] }))}
            className="w-full flex items-center gap-4 py-4 hover:bg-white/3 rounded-xl px-3 -mx-3 transition-colors group"
          >
            <img src={s.logo} alt={s.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            <span className="text-base font-bold text-white">{s.name}</span>
            <span className="text-sm text-white/30">{s.systems.length} системы</span>
            <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: `${s.statusColor}18`, color: s.statusColor }}>
              {s.statusLabel}
            </span>
            <Icon name={open[s.code] ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-white/30 group-hover:text-white/60 flex-shrink-0" />
          </button>

          {/* Системы */}
          {open[s.code] && (
            <div className="ml-14 mb-2">
              {s.systems.map((sys, idx) => {
                const dropKey = `${s.code}-${idx}`;
                const isDropOpen = dropOpen === dropKey;
                const activeTypes = ALL_MOUNT_TYPES.filter(mt => sys.types.includes(mt.id));
                return (
                  <div key={idx} className="flex items-center gap-3 py-3 border-t border-white/5 first:border-0 group/row">
                    {/* Название + вольтаж — кликабельное, переход в Категории */}
                    <button
                      onClick={() => onGoToCategories(sys.name)}
                      className="flex items-center gap-2 w-48 flex-shrink-0 text-left hover:text-[var(--neon)] transition-colors group/name"
                    >
                      <span className="text-sm font-semibold text-white group-hover/name:text-[var(--neon)] whitespace-nowrap transition-colors">{sys.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded text-[var(--neon)] bg-[var(--neon)]/10 font-semibold whitespace-nowrap">{sys.voltage}</span>
                      <Icon name="ChevronRight" size={13} className="text-white/20 group-hover/name:text-[var(--neon)] transition-colors flex-shrink-0" />
                    </button>

                    {/* Dropdown типов монтажа */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setDropOpen(isDropOpen ? null : dropKey)}
                        className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                      >
                        <span className="text-xs text-white/50 flex-1 truncate">
                          {activeTypes.length === 0
                            ? 'Типы не выбраны'
                            : activeTypes.map(mt => mt.label).join(', ')
                          }
                        </span>
                        <span className="text-[10px] text-white/25 flex-shrink-0">{activeTypes.length}/{ALL_MOUNT_TYPES.length}</span>
                        <Icon name={isDropOpen ? 'ChevronUp' : 'ChevronDown'} size={12} className="text-white/25 flex-shrink-0" />
                      </button>

                      {isDropOpen && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-1 min-w-48">
                          {ALL_MOUNT_TYPES.map(mt => {
                            const active = sys.types.includes(mt.id);
                            return (
                              <button key={mt.id}
                                onClick={() => toggleType(s.code, idx, mt.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                                  active ? 'text-[var(--neon)] bg-[var(--neon)]/10' : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}>
                                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${active ? 'bg-[var(--neon)] border-[var(--neon)]' : 'border-white/20'}`}>
                                  {active && <Icon name="Check" size={10} className="text-white" />}
                                </div>
                                {mt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {s.status === 'waiting' && (
                <div className="flex items-center gap-2 py-3 text-amber-400/60 text-xs border-t border-white/5">
                  <Icon name="Clock" size={12} className="flex-shrink-0" />
                  <span>Ожидаем доступ из ЛК. После получения — загрузите данные во вкладке «Товары».</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Категории товаров (CRUD) ─────────────────────────────────────────────────
function CategoriesTab({ onGoToCat, contextSeriesName }: { onGoToCat: (catKey: string, seriesName?: string) => void; contextSeriesName?: string }) {
  const [cats, setCats] = useState(ALL_CATEGORIES.map(c => ({ ...c, enabled: true, order: ALL_CATEGORIES.indexOf(c) })));
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  const startEdit = (i: number) => {
    setEditIdx(i);
    setEditLabel(cats[i].label);
    setEditEmoji(cats[i].emoji);
  };

  const saveEdit = () => {
    if (editIdx === null) return;
    setCats(prev => prev.map((c, i) => i === editIdx ? { ...c, label: editLabel, emoji: editEmoji } : c));
    setEditIdx(null);
  };

  const addCat = () => {
    if (!newKey || !newLabel) return;
    setCats(prev => [...prev, { key: newKey.toLowerCase().replace(/\s+/g, '_'), label: newLabel, emoji: newEmoji || '📦', enabled: true, order: prev.length }]);
    setNewKey(''); setNewLabel(''); setNewEmoji(''); setAddMode(false);
  };

  const toggle = (i: number) => setCats(prev => prev.map((c, idx) => idx === i ? { ...c, enabled: !c.enabled } : c));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {/* Хлебная крошка: если пришли из системы */}
        {contextSeriesName ? (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-white/30">Категории системы</span>
            <Icon name="ChevronRight" size={13} className="text-white/20" />
            <span className="text-white font-semibold">{contextSeriesName}</span>
          </div>
        ) : (
          <span className="text-white/40 text-sm">{cats.filter(c => c.enabled).length} из {cats.length} активны</span>
        )}
        <button onClick={() => setAddMode(p => !p)}
          className="ml-auto flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[var(--neon)]/15 text-[var(--neon)] hover:bg-[var(--neon)]/25 transition-all font-medium">
          <Icon name="Plus" size={14} /> Новая категория
        </button>
      </div>

      {/* Форма добавления */}
      {addMode && (
        <div className="flex items-center gap-2 mb-4 py-3 border-b border-white/8">
          <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="😀" className="w-14 text-center bg-white/6 text-white rounded-xl text-lg px-2 py-2 focus:outline-none" />
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Название категории *" className={inputCls} />
          <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="ключ (латиница)" className="bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none w-40 placeholder:text-white/25" />
          <button onClick={addCat} disabled={!newKey || !newLabel}
            className="neon-btn text-white text-sm px-4 py-2 rounded-xl font-semibold flex-shrink-0 disabled:opacity-40">
            Добавить
          </button>
          <button onClick={() => setAddMode(false)} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
            <Icon name="X" size={16} />
          </button>
        </div>
      )}

      {/* Список категорий */}
      {cats.map((cat, i) => (
        <div key={cat.key} className={`border-b border-white/5 last:border-0 ${!cat.enabled ? 'opacity-40' : ''}`}>
          {/* Основная строка */}
          <div className="flex items-center gap-3 py-3 group">
            {/* Эмодзи (всегда видно) */}
            <span className="text-xl w-10 text-center flex-shrink-0">{cat.emoji}</span>

            {/* Название */}
            {editIdx === i ? (
              <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="flex-1 bg-[#1e1e2e] text-white rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 border border-white/10" />
            ) : (
              <button onClick={() => onGoToCat(cat.key, contextSeriesName)}
                className={`flex-1 text-left text-sm font-medium transition-colors ${cat.enabled ? 'text-white hover:text-[var(--neon)]' : 'text-white/50'}`}>
                {cat.label}
              </button>
            )}

            {/* Ключ */}
            <span className="text-xs text-white/20 font-mono w-36 truncate flex-shrink-0 hidden sm:block">{cat.key}</span>

            {/* Действия */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {editIdx === i ? (
                <>
                  <button onClick={saveEdit} className="text-[var(--neon)] hover:opacity-70 p-1 transition-opacity"><Icon name="Check" size={15} /></button>
                  <button onClick={() => setEditIdx(null)} className="text-white/30 hover:text-white p-1 transition-colors"><Icon name="X" size={15} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => onGoToCat(cat.key, contextSeriesName)}
                    className="text-white/20 hover:text-[var(--neon)] p-1 transition-colors opacity-0 group-hover:opacity-100">
                    <Icon name="ArrowRight" size={14} />
                  </button>
                  <button onClick={() => startEdit(i)} className="text-white/20 hover:text-white p-1 transition-colors"><Icon name="Pencil" size={14} /></button>
                  <button onClick={() => toggle(i)}
                    className={`p-1 transition-colors ${cat.enabled ? 'text-white/20 hover:text-amber-400' : 'text-white/20 hover:text-green-400'}`}>
                    <Icon name={cat.enabled ? 'EyeOff' : 'Eye'} size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Форма редактирования (разворачивается под строкой) */}
          {editIdx === i && (
            <div className="ml-13 mb-3 pl-10 flex gap-2">
              <div className="flex flex-col gap-1 flex-shrink-0">
                <span className="text-[10px] text-white/30 uppercase tracking-wide">Иконка</span>
                <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)}
                  placeholder="😀"
                  className="w-14 text-center bg-[#1e1e2e] text-white rounded-lg text-xl px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 border border-white/10" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[10px] text-white/30 uppercase tracking-wide">URL картинки (опционально)</span>
                <input
                  placeholder="https://... или оставьте пустым"
                  className="w-full bg-[#1e1e2e] text-white rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 border border-white/10 placeholder:text-white/20" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Товары ───────────────────────────────────────────────────────────────────
function ProductsTab({ initSeriesId, initSeriesName, initCatKey }: { initSeriesId?: number; initSeriesName?: string; initCatKey?: string }) {
  const [catalog, setCatalog] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSup, setSelectedSup] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(initSeriesId ?? null);
  const [selectedCat, setSelectedCat] = useState<string | null>(initCatKey ?? null);
  const [addingForm, setAddingForm] = useState(false);
  const [form, setForm] = useState({ article: '', name: '', category: 'track', voltage: '', unit: 'шт', price: '' });
  const [saving, setSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [priceVal, setPriceVal] = useState('');

  const load = () => {
    setLoading(true);
    getCatalogHierarchy().then((d: Supplier[]) => {
      setCatalog(d);
      // Автовыбор по id серии
      if (initSeriesId) {
        const sup = d.find(s => s.series.some(sr => sr.id === initSeriesId));
        if (sup) { setSelectedSup(sup.id); setSelectedSeries(initSeriesId); }
      }
      // Автовыбор по имени серии (переход из Поставщики)
      else if (initSeriesName) {
        for (const sup of d) {
          const sr = sup.series.find(s => s.name === initSeriesName || s.name.replace('(V)', '(В)') === initSeriesName);
          if (sr) { setSelectedSup(sup.id); setSelectedSeries(sr.id); break; }
        }
      }
      // Автовыбор по ключу категории (переход из Категории) — берём первого поставщика и первую серию с этой категорией
      else if (initCatKey) {
        for (const sup of d) {
          const sr = sup.series.find(s => s.categories.some(c => c.key === initCatKey));
          if (sr) { setSelectedSup(sup.id); setSelectedSeries(sr.id); setSelectedCat(initCatKey); break; }
        }
        // Если ни одна серия не содержит — просто выбираем первого поставщика и первую серию
        if (!d.flatMap(s => s.series).some(sr => sr.categories.some(c => c.key === initCatKey))) {
          if (d.length > 0) {
            setSelectedSup(d[0].id);
            if (d[0].series.length > 0) setSelectedSeries(d[0].series[0].id);
          }
        }
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
    setSaving(false); setAddingForm(false);
    setForm(p => ({ ...p, article: '', name: '', voltage: '', price: '' }));
    load();
  };

  const handleDelete = async (id: number) => { await deleteProduct(id); load(); };
  const savePrice = async (id: number) => { await updateProductPrice(id, Number(priceVal)); setEditingPrice(null); load(); };

  if (loading) return <div className="py-16 text-center text-white/20 text-sm animate-pulse">Загружаю...</div>;

  const catEmoji = (key: string) => ALL_CATEGORIES.find(c => c.key === key)?.emoji ?? '📦';

  return (
    <div className="space-y-3">
      {/* Поставщики */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {catalog.filter(sup => sup.code !== 'ego').map(sup => {
          const active = selectedSup === sup.id;
          return (
            <div key={sup.id} className={`flex items-center rounded-xl text-sm font-semibold transition-all ${active ? 'bg-[var(--neon)]' : 'bg-white/6 hover:bg-white/10'}`}>
              <button onClick={() => { setSelectedSup(sup.id); setSelectedSeries(null); setSelectedCat(null); }}
                className={`flex items-center gap-1.5 pl-3 ${active ? 'pr-1.5' : 'pr-3'} py-1.5 ${active ? 'text-white' : 'text-white/50 hover:text-white'}`}>
                <img src={ARLIGHT_LOGO} alt="" className="w-4 h-4 rounded object-cover" />
                {sup.name}
              </button>
              {active && (
                <button onClick={() => { setSelectedSup(null); setSelectedSeries(null); setSelectedCat(null); }}
                  className="pr-2 pl-0.5 py-1.5 text-white/60 hover:text-white transition-colors">
                  <Icon name="X" size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Системы */}
      {selectedSup && (
        <div className="flex flex-wrap gap-1.5">
          {catalog.find(s => s.id === selectedSup)?.series.map(sr => {
            const active = selectedSeries === sr.id;
            return (
              <div key={sr.id} className={`flex items-center rounded-xl text-sm font-medium transition-all ${active ? 'bg-white/15' : 'bg-white/5 hover:bg-white/8'}`}>
                <button onClick={() => { setSelectedSeries(sr.id); setSelectedCat(null); }}
                  className={`flex items-center pl-3 ${active ? 'pr-1.5' : 'pr-3'} py-1.5 ${active ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                  {sr.name} <span className="text-xs opacity-40 ml-1.5">{sr.product_count}</span>
                </button>
                {active && (
                  <button onClick={() => { setSelectedSeries(null); setSelectedCat(null); }}
                    className="pr-2 pl-0.5 py-1.5 text-white/40 hover:text-white transition-colors">
                    <Icon name="X" size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Категории */}
      {selectedSeries && (
        <div className="flex flex-wrap gap-1.5">
          {currentSeries?.categories.map(cat => {
            const active = selectedCat === cat.key;
            return (
              <div key={cat.key} className={`flex items-center rounded-xl text-sm font-medium transition-all ${active ? 'bg-white/15' : 'bg-white/5 hover:bg-white/8'}`}>
                <button onClick={() => setSelectedCat(cat.key)}
                  className={`flex items-center gap-1.5 pl-3 ${active ? 'pr-1.5' : 'pr-3'} py-1.5 whitespace-nowrap ${active ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                  <span className="text-base leading-none">{catEmoji(cat.key)}</span>
                  {cat.label}
                  <span className="text-xs opacity-40">{cat.products.length}</span>
                </button>
                {active && (
                  <button onClick={() => setSelectedCat(null)}
                    className="pr-2 pl-0.5 py-1.5 text-white/40 hover:text-white transition-colors">
                    <Icon name="X" size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Товары */}
      {selectedCat && (
        <div>
          {/* Заголовок */}
          <div className="flex items-center gap-3 py-3 border-b border-white/8">
            <span className="text-lg">{catEmoji(selectedCat)}</span>
            <span className="font-bold text-white">{currentCat?.label}</span>
            <span className="text-sm text-white/30">{products.length} поз.</span>
            <button onClick={() => setAddingForm(p => !p)}
              className="ml-auto flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-[var(--neon)]/15 text-[var(--neon)] hover:bg-[var(--neon)]/25 transition-all font-medium">
              <Icon name="Plus" size={13} /> Добавить
            </button>
          </div>

          {/* Форма */}
          {addingForm && (
            <div className="py-3 border-b border-white/8 space-y-2">
              <div className="flex gap-2">
                <input value={form.article} onChange={e => setForm(p => ({...p, article: e.target.value}))} placeholder="Артикул *" className={inputCls} />
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Название *" className={inputCls} />
              </div>
              <div className="flex gap-2">
                <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className="bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none flex-1">
                  {ALL_CATEGORIES.map(o => <option key={o.key} value={o.key} className="bg-[#111]">{o.emoji} {o.label}</option>)}
                </select>
                <input value={form.voltage} onChange={e => setForm(p => ({...p, voltage: e.target.value}))} placeholder="В" className="bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none w-16 placeholder:text-white/25" />
                <input value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))} placeholder="ед." className="bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none w-16 placeholder:text-white/25" />
                <input value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="Цена ₽" className="bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none w-28 placeholder:text-white/25" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={saving || !form.article || !form.name}
                  className="neon-btn text-white text-sm px-5 py-2 rounded-xl font-semibold disabled:opacity-40">
                  {saving ? 'Сохраняю...' : 'Добавить'}
                </button>
                <button onClick={() => setAddingForm(false)} className="text-white/30 text-sm hover:text-white px-2 transition-colors">Отмена</button>
              </div>
            </div>
          )}

          {/* Шапка */}
          <div className="flex items-center gap-3 py-2 text-xs text-white/25 uppercase tracking-wider">
            <span className="w-9 flex-shrink-0" />
            <span className="w-28 flex-shrink-0">Артикул</span>
            <span className="flex-1">Название</span>
            <span className="w-8 text-right">Ед.</span>
            <span className="w-24 text-right">Цена</span>
            <span className="w-5" />
          </div>

          {products.length === 0 && <div className="py-10 text-center text-white/20 text-sm">Пусто</div>}

          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-t border-white/5 group hover:bg-white/2 rounded-lg transition-colors">
              {/* Картинка / плейсхолдер */}
              <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden bg-white/6 flex items-center justify-center text-lg">
                {p.image_id
                  ? <img src={p.image_id} alt="" className="w-full h-full object-cover" />
                  : <span className="text-base leading-none">{catEmoji(p.category)}</span>
                }
              </div>
              <span className="font-mono text-white/30 text-xs w-28 flex-shrink-0 truncate">{p.article}</span>
              <span className="flex-1 text-white text-sm truncate">{p.name}</span>
              <span className="text-white/30 text-xs w-8 text-right">{p.unit}</span>
              {editingPrice === p.id ? (
                <div className="flex items-center gap-1 w-24 justify-end">
                  <input autoFocus value={priceVal} onChange={e => setPriceVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && savePrice(p.id)}
                    className="w-16 bg-white/10 text-white text-sm px-2 py-1 rounded-lg focus:outline-none" />
                  <button onClick={() => savePrice(p.id)} className="text-[var(--neon)]"><Icon name="Check" size={13} /></button>
                  <button onClick={() => setEditingPrice(null)} className="text-white/20"><Icon name="X" size={13} /></button>
                </div>
              ) : (
                <button onClick={() => { setEditingPrice(p.id); setPriceVal(String(p.price ?? '')); }}
                  className="w-24 text-right text-white text-sm font-semibold hover:text-[var(--neon)] transition-colors">
                  {p.price != null ? `${p.price.toLocaleString('ru')} ₽` : <span className="text-white/20 font-normal">—</span>}
                </button>
              )}
              <button onClick={() => handleDelete(p.id)} className="w-5 opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all">
                <Icon name="Trash2" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!selectedSup && (
        <div className="py-20 text-center text-white/20 text-sm">Выбери поставщика → систему → категорию</div>
      )}
    </div>
  );
}

// ─── Главная ──────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'screens' | 'suppliers' | 'categories' | 'products'>('screens');
  const [drillSeriesId, setDrillSeriesId] = useState<number | undefined>();
  const [drillSeriesName, setDrillSeriesName] = useState<string | undefined>();  // для Товаров
  const [drillCatKey, setDrillCatKey] = useState<string | undefined>();
  const [drillSeriesNameForCat, setDrillSeriesNameForCat] = useState<string | undefined>(); // для Категорий

  // Поставщики → клик на систему → Категории
  const goToCategories = (seriesName: string) => {
    setDrillSeriesNameForCat(seriesName);
    setTab('categories');
  };

  // Категории → клик на категорию → Товары
  const goToCat = (catKey: string, seriesName?: string) => {
    setDrillCatKey(catKey);
    setDrillSeriesName(seriesName);
    setDrillSeriesId(undefined);
    setTab('products');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="flex items-center gap-6 px-8 py-4 border-b border-white/6 sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm flex-shrink-0">
          <Icon name="ArrowLeft" size={15} /> Назад
        </button>
        <span className="text-base font-black text-white flex-shrink-0">Настройки</span>
        <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                tab === t.key ? 'bg-[var(--neon)] text-white shadow-[0_0_16px_rgba(61,90,254,0.35)]' : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {tab === 'screens'    && <AdminScreensTab />}
        {tab === 'suppliers'  && <SuppliersTab onGoToCategories={goToCategories} />}
        {tab === 'categories' && <CategoriesTab onGoToCat={goToCat} contextSeriesName={drillSeriesNameForCat} />}
        {tab === 'products'   && <ProductsTab initSeriesId={drillSeriesId} initSeriesName={drillSeriesName} initCatKey={drillCatKey} />}
      </div>
    </div>
  );
}