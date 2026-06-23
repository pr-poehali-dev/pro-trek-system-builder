import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getCatalogHierarchy, addProduct, updateProductPrice, deleteProduct } from '@/lib/api';

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

const ARLIGHT_LOGO = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/67102236-293c-4925-b47f-e13686e93b7e.jpg';

const inputCls = "bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 placeholder:text-white/25 w-full";

interface Product  { id: number; article: string; name: string; category: string; voltage: number | null; unit: string; obsolete: boolean; price: number | null; stock_qty: number | null; image_id?: string }
interface CatGroup { key: string; label: string; products: Product[] }
interface Series   { id: number; name: string; voltage: number | null; product_count: number; categories: CatGroup[] }
interface Supplier { id: number; code: string; name: string; series: Series[] }

export default function ProductsTab({ initSeriesId, initSeriesName, initCatKey }: { initSeriesId?: number; initSeriesName?: string; initCatKey?: string }) {
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
      if (initSeriesId) {
        const sup = d.find(s => s.series.some(sr => sr.id === initSeriesId));
        if (sup) { setSelectedSup(sup.id); setSelectedSeries(initSeriesId); }
      } else if (initSeriesName) {
        for (const sup of d) {
          const sr = sup.series.find(s => s.name === initSeriesName || s.name.replace('(V)', '(В)') === initSeriesName);
          if (sr) { setSelectedSup(sup.id); setSelectedSeries(sr.id); break; }
        }
      } else if (initCatKey) {
        for (const sup of d) {
          const sr = sup.series.find(s => s.categories.some(c => c.key === initCatKey));
          if (sr) { setSelectedSup(sup.id); setSelectedSeries(sr.id); setSelectedCat(initCatKey); break; }
        }
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
          <div className="flex items-center gap-3 py-3 border-b border-white/8">
            <span className="text-lg">{catEmoji(selectedCat)}</span>
            <span className="font-bold text-white">{currentCat?.label}</span>
            <span className="text-sm text-white/30">{products.length} поз.</span>
            <button onClick={() => setAddingForm(p => !p)}
              className="ml-auto flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-[var(--neon)]/15 text-[var(--neon)] hover:bg-[var(--neon)]/25 transition-all font-medium">
              <Icon name="Plus" size={13} /> Добавить
            </button>
          </div>

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
