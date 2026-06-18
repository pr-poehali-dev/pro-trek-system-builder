import { useState } from 'react';
import { parseCatalog, seedDemo } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  onClose: () => void;
  onSupplierChange?: (code: string) => void;
  currentSupplier?: string;
}

const SUPPLIERS = [
  { code: 'arlight', name: 'Arlight', note: 'MAG-45 (48В) + TRACK-4TR (220В)' },
  { code: 'ego',     name: 'EGO Lighting', note: 'EGO-TRACK-48 + EGO-TRACK-220 (DEMO)' },
];

export default function AdminPanel({ onClose, onSupplierChange, currentSupplier = 'arlight' }: Props) {
  const [loading, setLoading]     = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [result, setResult]       = useState<Record<string, unknown> | null>(null);
  const [limit, setLimit]         = useState('100');
  const [supplier, setSupplier]   = useState(currentSupplier);
  const [tab, setTab]             = useState<'parse' | 'demo' | 'supplier'>('supplier');

  const handleParse = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await parseCatalog(supplier, Number(limit) || 0);
      setResult(r);
    } catch (e) {
      setResult({ error: String(e) });
    }
    setLoading(false);
  };

  const handleSeedDemo = async () => {
    setSeedLoading(true);
    setResult(null);
    try {
      const r = await seedDemo();
      setResult({ demo: r });
    } catch (e) {
      setResult({ error: String(e) });
    }
    setSeedLoading(false);
  };

  const handleSupplierSelect = (code: string) => {
    setSupplier(code);
    onSupplierChange?.(code);
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-card)] animate-fadein">
      <div className="max-w-3xl mx-auto">
        {/* Tabs header */}
        <div className="flex items-center gap-0 border-b border-[var(--border)] px-4">
          {[
            { key: 'supplier', label: 'Поставщик', icon: 'Building2' },
            { key: 'demo',     label: 'Демо-данные', icon: 'Database' },
            { key: 'parse',    label: 'Парсинг Arlight', icon: 'Download' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all -mb-px ${
                tab === t.key
                  ? 'border-[var(--neon)] text-[var(--neon)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={12} />
              {t.label}
            </button>
          ))}
          <div className="ml-auto py-3">
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* ── Tab: Поставщик ── */}
          {tab === 'supplier' && (
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-3">
                Выберите поставщика для расчётов и подбора товаров
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SUPPLIERS.map(s => (
                  <button
                    key={s.code}
                    onClick={() => handleSupplierSelect(s.code)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      supplier === s.code
                        ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.08)] shadow-[0_0_12px_var(--neon-glow)]'
                        : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${supplier === s.code ? 'bg-[var(--neon)]' : 'bg-[var(--border)]'}`} />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{s.name}</span>
                      {s.code === 'ego' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">DEMO</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] ml-4">{s.note}</div>
                    {supplier === s.code && (
                      <div className="mt-2 ml-4 text-[10px] neon-text font-semibold">✓ Активный</div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-[var(--text-muted)]">
                💡 Система будет рассчитывать спецификацию из каталога выбранного поставщика.
                На шаге 5 можно сравнить цены обоих поставщиков.
              </div>
            </div>
          )}

          {/* ── Tab: Демо-данные ── */}
          {tab === 'demo' && (
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-3">
                Заполнить БД демо-товарами для тестирования мульти-поставщик логики.
                Создаёт <strong className="text-[var(--text-primary)]">Arlight: 38 товаров</strong> и <strong className="text-[var(--text-primary)]">EGO Lighting: 31 товар</strong>.
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                {[
                  { label: 'Треки', count: '11 шт (0.5м–3м)', icon: 'Minus' },
                  { label: 'Соединители', count: '6 видов', icon: 'Link' },
                  { label: 'Светильники', count: '8 моделей', icon: 'Zap' },
                  { label: 'БП / Электрика', count: '4 БП + токовводы', icon: 'Battery' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={12} className="text-[var(--neon)] flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSeedDemo}
                disabled={seedLoading}
                className="neon-btn text-white text-sm px-6 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <Icon name="Database" size={14} />
                {seedLoading ? '⏳ Заполняю...' : '🚀 Загрузить демо-данные (Arlight + EGO)'}
              </button>
              {result && (result as { demo?: { ok: boolean; total: number; results: Record<string, { added: number }> } }).demo && (
                <div className="mt-3 p-3 rounded-lg bg-[rgba(0,230,118,0.05)] border border-[rgba(0,230,118,0.2)]">
                  <div className="text-sm text-[var(--success)] font-semibold mb-1">✅ Данные загружены!</div>
                  {Object.entries((result as { demo: { results: Record<string, { added: number }> } }).demo.results).map(([k, v]) => (
                    <div key={k} className="text-xs text-[var(--text-secondary)]">
                      {k}: <strong>{v.added}</strong> товаров
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Парсинг Arlight ── */}
          {tab === 'parse' && (
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-3">
                Парсинг реального JSON-каталога Arlight из ЛК
              </div>
              <div className="flex gap-3 items-end">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Лимит (0 = все)</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    className="w-28 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-[var(--neon)]"
                  />
                </div>
                <button
                  onClick={handleParse}
                  disabled={loading}
                  className="neon-btn text-white text-sm px-5 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? '⏳ Парсю...' : '▶ Запустить парсинг'}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">
                100 товаров ≈ 5 сек. Полный каталог (0) ≈ 1-2 минуты.
              </p>
              {result && !(result as { demo?: unknown }).demo && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                  {(result as { error?: string }).error ? (
                    <div className="text-[var(--danger)] text-sm">{(result as { error: string }).error}</div>
                  ) : (
                    <div className="text-sm">
                      <div className="flex gap-4 flex-wrap">
                        <span>✅ <strong className="neon-text">{String((result as { saved?: unknown }).saved ?? 0)}</strong> сохранено</span>
                        <span>⏭ {String((result as { skipped?: unknown }).skipped ?? 0)} пропущено</span>
                        <span>❌ {String((result as { errors?: unknown }).errors ?? 0)} ошибок</span>
                      </div>
                      {(result as { categories?: Record<string, number> }).categories && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {Object.entries((result as { categories: Record<string, number> }).categories).map(([k, v]) => (
                            <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--text-secondary)]">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
