import { useState } from 'react';
import { parseCatalog } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [limit, setLimit] = useState('100');

  const handleParse = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await parseCatalog('arlight', Number(limit) || 0);
      setResult(r);
    } catch (e) {
      setResult({ error: String(e) });
    }
    setLoading(false);
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-card)] p-4 animate-fadein">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            Загрузка каталога Arlight в базу данных
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex gap-3 items-end">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
              Лимит (0 = все)
            </label>
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
            className="neon-btn text-white text-sm px-5 py-1.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Загружаю...' : '▶ Запустить парсинг'}
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] mt-2">
          Начните с лимита 100 для теста. Полный каталог (0) может занять 1-2 минуты.
        </p>

        {result && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            {(result as { error?: string }).error ? (
              <div className="text-[var(--danger)] text-sm">Ошибка: {(result as { error: string }).error}</div>
            ) : (
              <div className="text-sm text-[var(--text-primary)]">
                <div className="flex gap-4 flex-wrap">
                  <span>✅ Сохранено: <strong className="neon-text">{String((result as { saved?: unknown }).saved ?? 0)}</strong></span>
                  <span>⏭ Пропущено: <strong>{String((result as { skipped?: unknown }).skipped ?? 0)}</strong></span>
                  <span>❌ Ошибок: <strong>{String((result as { errors?: unknown }).errors ?? 0)}</strong></span>
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
    </div>
  );
}
