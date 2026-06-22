import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { getCatalogHierarchy, addProduct, updateProductPrice, deleteProduct, uploadCatalogJson } from '@/lib/api';

const CATEGORY_OPTIONS = [
  { value: 'track',               label: 'Шинопровод' },
  { value: 'head',                label: 'Светильники' },
  { value: 'connector_straight',  label: 'Соединители прямые' },
  { value: 'connector_angle',     label: 'Соединители угловые' },
  { value: 'connector_flexible',  label: 'Соединители гибкие' },
  { value: 'end_cap',             label: 'Заглушки' },
  { value: 'mount',               label: 'Крепёж / подвесы' },
  { value: 'power_inlet',         label: 'Токовводы' },
  { value: 'driver',              label: 'Блоки питания' },
  { value: 'controller',          label: 'Контроллеры' },
  { value: 'base',                label: 'Базы / адаптеры' },
  { value: 'accessory',           label: 'Аксессуары' },
];

const SUPPLIER_COLORS: Record<string, string> = {
  arlight: '#3d5afe',
  ego:     '#f59e0b',
};

interface Product {
  id: number; article: string; name: string; category: string;
  voltage: number | null; unit: string; obsolete: boolean;
  price: number | null; stock_qty: number | null;
}
interface Category  { key: string; label: string; products: Product[] }
interface Series    { id: number; name: string; voltage: number | null; product_count: number; categories: Category[] }
interface Supplier  { id: number; code: string; name: string; series: Series[] }

// Форма добавления товара
function AddProductForm({ seriesId, onSaved }: { seriesId: number; onSaved: () => void }) {
  const [form, setForm] = useState({ article: '', name: '', category: 'track', voltage: '', unit: 'шт', price: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.article || !form.name) return;
    setSaving(true);
    await addProduct({
      series_id: seriesId,
      article: form.article,
      name: form.name,
      category: form.category,
      voltage: form.voltage ? Number(form.voltage) : undefined,
      unit: form.unit,
      price: form.price ? Number(form.price) : undefined,
    });
    setSaving(false);
    setForm({ article: '', name: '', category: 'track', voltage: '', unit: 'шт', price: '' });
    onSaved();
  };

  return (
    <div className="mt-3 p-3 rounded-xl border border-[var(--neon)]/30 bg-[var(--neon)]/5 space-y-2">
      <div className="text-[11px] font-bold text-[var(--neon)] mb-2">Новый товар</div>
      <div className="grid grid-cols-2 gap-2">
        {(['article:Артикул *', 'name:Название *'] as const).map(f => {
          const [key, ph] = f.split(':');
          return <input key={key} value={(form as Record<string,string>)[key]}
            onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
            placeholder={ph}
            className="bg-[var(--bg-primary)] border border-[var(--border)] text-white rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:border-[var(--neon)] placeholder:text-white/25" />;
        })}
        <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-white rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:border-[var(--neon)]">
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex gap-1.5">
          {([['voltage','Вольт','w-20'],['unit','Ед.','w-16'],['price','Цена ₽','flex-1']] as const).map(([k,ph,cls]) => (
            <input key={k} value={(form as Record<string,string>)[k]}
              onChange={e => setForm(p => ({...p, [k]: e.target.value}))}
              placeholder={ph}
              className={`bg-[var(--bg-primary)] border border-[var(--border)] text-white rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:border-[var(--neon)] placeholder:text-white/25 ${cls}`} />
          ))}
        </div>
      </div>
      <button onClick={save} disabled={saving || !form.article || !form.name}
        className="neon-btn text-white text-xs px-4 py-1.5 rounded-lg font-semibold disabled:opacity-40">
        {saving ? 'Сохраняю...' : '+ Добавить'}
      </button>
    </div>
  );
}

// Строка товара
function ProductRow({ product, onDelete, onPriceUpdate }: {
  product: Product; onDelete: (id: number) => void; onPriceUpdate: (id: number, price: number) => void;
}) {
  const [editPrice, setEditPrice] = useState(false);
  const [priceVal, setPriceVal] = useState(String(product.price ?? ''));
  const [saving, setSaving] = useState(false);

  const savePrice = async () => {
    setSaving(true);
    await updateProductPrice(product.id, Number(priceVal));
    onPriceUpdate(product.id, Number(priceVal));
    setSaving(false);
    setEditPrice(false);
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 hover:bg-white/3 rounded-lg group text-xs">
      <span className="font-mono text-white/40 w-28 flex-shrink-0 truncate">{product.article}</span>
      <span className="flex-1 text-white/80 truncate">{product.name}</span>
      <span className="text-white/30 w-8 text-right flex-shrink-0">{product.unit}</span>
      {editPrice ? (
        <div className="flex items-center gap-1">
          <input autoFocus value={priceVal} onChange={e => setPriceVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && savePrice()}
            className="w-20 bg-[var(--bg-primary)] border border-[var(--neon)]/50 text-white text-xs px-2 py-0.5 rounded focus:outline-none" />
          <button onClick={savePrice} disabled={saving} className="text-[var(--neon)] hover:opacity-70">
            <Icon name="Check" size={12} />
          </button>
          <button onClick={() => setEditPrice(false)} className="text-white/30 hover:text-white">
            <Icon name="X" size={12} />
          </button>
        </div>
      ) : (
        <button onClick={() => setEditPrice(true)}
          className="w-20 text-right text-white/60 hover:text-[var(--neon)] transition-colors">
          {product.price != null ? `${product.price.toLocaleString('ru')} ₽` : <span className="text-white/20">— ₽</span>}
        </button>
      )}
      <button onClick={() => onDelete(product.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all ml-1">
        <Icon name="Trash2" size={12} />
      </button>
    </div>
  );
}

export default function AdminCatalogTab() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSeries, setOpenSeries] = useState<Record<number, boolean>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ supplier: string; saved: number } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    const res = await getCatalogHierarchy();
    setData(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (productId: number) => {
    await deleteProduct(productId);
    load();
  };

  const handlePriceUpdate = (productId: number, price: number) => {
    setData(prev => prev.map(sup => ({
      ...sup,
      series: sup.series.map(sr => ({
        ...sr,
        categories: sr.categories.map(cat => ({
          ...cat,
          products: cat.products.map(p => p.id === productId ? { ...p, price } : p),
        })),
      })),
    })));
  };

  const handleFileUpload = async (supplierCode: string, file: File) => {
    setUploading(supplierCode);
    setUploadResult(null);
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      const arr = Array.isArray(items) ? items : items.items ?? items.products ?? [];
      const res = await uploadCatalogJson(supplierCode, arr);
      setUploadResult({ supplier: supplierCode, saved: res.saved ?? 0 });
      load();
    } catch { setUploadResult({ supplier: supplierCode, saved: -1 }); }
    setUploading(null);
  };

  if (loading) return <div className="text-center py-12 text-white/30 text-sm animate-pulse">Загружаю каталог...</div>;

  return (
    <div className="space-y-4">
      <div className="pro-card p-3 flex items-start gap-3">
        <Icon name="Info" size={13} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-white/60 leading-relaxed">
          Иерархия: <strong className="text-white">Поставщик → Система → Категория → Товары</strong>.
          Редактируй цены кликом, добавляй товары вручную или загрузи JSON-файл от поставщика.
        </div>
      </div>

      {data.map(supplier => (
        <div key={supplier.id} className="pro-card overflow-hidden">

          {/* Шапка поставщика */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]"
            style={{ background: `linear-gradient(135deg, ${SUPPLIER_COLORS[supplier.code] ?? '#fff'}12, transparent)` }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SUPPLIER_COLORS[supplier.code] ?? '#fff' }} />
            <span className="font-black text-white text-sm">{supplier.name}</span>
            <span className="text-[10px] text-white/30 ml-1">
              {supplier.series.reduce((s, sr) => s + sr.product_count, 0)} товаров
            </span>

            {/* Загрузка JSON */}
            <div className="ml-auto flex items-center gap-2">
              {uploading === supplier.code && <span className="text-[10px] text-[var(--neon)] animate-pulse">Загружаю...</span>}
              {uploadResult?.supplier === supplier.code && uploadResult.saved >= 0 && (
                <span className="text-[10px] text-green-400">+{uploadResult.saved} товаров</span>
              )}
              <button
                onClick={() => fileRefs.current[supplier.code]?.click()}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-white/40 hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all">
                <Icon name="Upload" size={11} /> JSON
              </button>
              <input type="file" accept=".json" className="hidden"
                ref={el => { fileRefs.current[supplier.code] = el; }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(supplier.code, f); e.target.value = ''; }} />
            </div>
          </div>

          {/* Серии */}
          <div className="divide-y divide-[var(--border)]">
            {supplier.series.map(series => (
              <div key={series.id}>

                {/* Строка серии */}
                <button
                  onClick={() => setOpenSeries(p => ({ ...p, [series.id]: !p[series.id] }))}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left">
                  <Icon name={openSeries[series.id] ? 'ChevronDown' : 'ChevronRight'} size={13} className="text-white/30" />
                  <span className="font-bold text-sm text-white">{series.name}</span>
                  {series.voltage && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: `${SUPPLIER_COLORS[supplier.code]}22`, color: SUPPLIER_COLORS[supplier.code] }}>
                      {series.voltage}В
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-white/30">{series.product_count} поз.</span>
                  <button
                    onClick={e => { e.stopPropagation(); setAddingTo(addingTo === series.id ? null : series.id); }}
                    className="text-[10px] px-2 py-1 rounded-lg border border-[var(--border)] text-white/30 hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all ml-1">
                    + товар
                  </button>
                </button>

                {/* Форма добавления */}
                {addingTo === series.id && (
                  <div className="px-4 pb-3">
                    <AddProductForm seriesId={series.id} onSaved={() => { setAddingTo(null); load(); }} />
                  </div>
                )}

                {/* Категории */}
                {openSeries[series.id] && (
                  <div className="pb-2">
                    {series.categories.map(cat => {
                      const catKey = `${series.id}-${cat.key}`;
                      return (
                        <div key={cat.key}>
                          <button
                            onClick={() => setOpenCats(p => ({ ...p, [catKey]: !p[catKey] }))}
                            className="w-full flex items-center gap-2 px-6 py-2 hover:bg-white/2 transition-colors text-left">
                            <Icon name={openCats[catKey] ? 'ChevronDown' : 'ChevronRight'} size={11} className="text-white/20" />
                            <span className="text-[11px] font-semibold text-white/60">{cat.label}</span>
                            <span className="text-[10px] text-white/25 ml-1">{cat.products.length} шт</span>
                          </button>

                          {openCats[catKey] && (
                            <div className="px-4 pb-1">
                              {cat.products.map(p => (
                                <ProductRow key={p.id} product={p}
                                  onDelete={handleDelete}
                                  onPriceUpdate={handlePriceUpdate} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}