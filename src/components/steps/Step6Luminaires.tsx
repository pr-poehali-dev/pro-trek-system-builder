import { useState, useEffect } from 'react';
import { ProjectState, Product } from '@/lib/types';
import { getCatalog } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import Icon from '@/components/ui/icon';

interface Props { state: ProjectState; update: (p: Partial<ProjectState>) => void; next: () => void; back: () => void; totalSteps: number; }

export default function Step6Luminaires({ state, update, next, back, totalSteps }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [voltFilter, setVoltFilter] = useState<number | null>(state.voltage);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { category: 'head', supplier_code: state.supplierCode, limit: 200 };
    if (voltFilter) params.voltage = voltFilter;
    if (search) params.search = search;
    getCatalog(params).then(r => {
      setProducts(r.products || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [state.supplierCode, voltFilter, search]);

  const getQty = (id: number) => state.selectedLuminaires.find(l => l.product.id === id)?.qty ?? 0;

  const setQty = (product: Product, qty: number) => {
    const updated = state.selectedLuminaires.filter(l => l.product.id !== product.id);
    if (qty > 0) updated.push({ product, qty });
    update({ selectedLuminaires: updated });
  };

  const totalSelected = state.selectedLuminaires.reduce((s, l) => s + l.qty, 0);
  const totalPower = state.selectedLuminaires.reduce((s, l) => {
    const pw = Number(l.product.params?.power_w ?? 0);
    return s + pw * l.qty;
  }, 0);

  return (
    <div className="animate-fadein">
      <ProgressBar current={7} total={totalSteps} label="Светильники" />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1">← Назад</button>

        <div className="pro-card p-4 mb-5">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">Выберите светильники</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text" placeholder="Поиск по названию..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[var(--neon)] transition-colors"
            />
            <div className="flex gap-2">
              {[null, 48, 220].map(v => (
                <button
                  key={v}
                  onClick={() => setVoltFilter(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    voltFilter === v
                      ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {v ? `${v}В` : 'Все'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected summary */}
        {totalSelected > 0 && (
          <div className="pro-card p-3 mb-4 flex items-center justify-between animate-fadein">
            <div className="text-sm text-[var(--text-secondary)]">
              Выбрано: <strong className="neon-text">{totalSelected} шт.</strong>
              <span className="ml-3">Мощность: <strong className="text-[var(--text-primary)]">{totalPower.toFixed(0)} Вт</strong></span>
              <span className="ml-3 text-[10px] text-[var(--text-muted)]">БП нужен ≥ {Math.ceil(totalPower * 1.25)} Вт</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <div className="animate-spin text-3xl mb-3">⚡</div>
            <div className="text-sm">Загружаю каталог...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="pro-card p-10 text-center text-[var(--text-muted)]">
            <div className="text-4xl mb-3">💡</div>
            <div className="text-sm mb-2">Светильники не найдены в каталоге</div>
            <div className="text-xs">Загрузите каталог через меню <strong>⚙ Каталог</strong> в шапке</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => {
              const qty = getQty(p.id);
              const pw = Number(p.params?.power_w);
              const cct = Number(p.params?.cct_k);
              const beam = Number(p.params?.beam_angle);
              const volt = p.voltage;

              return (
                <div key={p.id} className={`pro-card overflow-hidden transition-all ${qty > 0 ? 'selected' : ''}`}>
                  {/* Image placeholder */}
                  <div className="aspect-square bg-[var(--bg-secondary)] flex items-center justify-center relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover opacity-80" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <Icon name="Zap" size={32} className="text-[var(--text-muted)]" />
                    )}
                    {volt && (
                      <span className={`absolute top-2 right-2 ${volt === 48 ? 'badge-48v' : 'badge-220v'}`}>{volt}В</span>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight mb-1 line-clamp-2">{p.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mb-2">{p.article}</div>

                    <div className="flex gap-2 flex-wrap mb-2">
                      {pw > 0 && <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{pw}Вт</span>}
                      {cct > 0 && <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{cct}К</span>}
                      {beam > 0 && <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{beam}°</span>}
                    </div>

                    {p.price && (
                      <div className="text-xs text-[var(--text-muted)] mb-2">{Math.round(p.price).toLocaleString('ru')} ₽ <span className="text-[9px]">(демо)</span></div>
                    )}

                    {/* qty control */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setQty(p, Math.max(0, qty - 1))}
                        className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all flex items-center justify-center text-sm"
                      >−</button>
                      <span className={`flex-1 text-center text-sm font-semibold ${qty > 0 ? 'neon-text' : 'text-[var(--text-muted)]'}`}>
                        {qty > 0 ? qty : '—'}
                      </span>
                      <button
                        onClick={() => setQty(p, qty + 1)}
                        className="w-7 h-7 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all flex items-center justify-center text-sm"
                      >+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={() => next()} className="border border-[var(--border)] text-[var(--text-secondary)] px-5 py-2.5 rounded-xl text-sm hover:border-[var(--text-muted)] transition-all">
            Пропустить
          </button>
          {totalSelected > 0 && (
            <button onClick={() => next()} className="neon-btn text-white font-semibold px-8 py-2.5 rounded-xl animate-fadein">
              Добавить в спецификацию →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}