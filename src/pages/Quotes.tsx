import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes, getStatuses, updateQuote } from '@/lib/api';
import { Quote, QuoteStatus_ } from '@/lib/types';
import Icon from '@/components/ui/icon';

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280', new: '#3d5afe', in_progress: '#f59e0b',
  sent: '#8b5cf6', approved: '#10b981', ordered: '#06b6d4',
  completed: '#00e676', cancelled: '#ef4444',
};

function StatusBadge({ code, label, color }: { code: string; label: string; color?: string }) {
  const bg = color || STATUS_COLORS[code] || '#6b7280';
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded text-white flex-shrink-0"
      style={{ backgroundColor: bg }}
    >
      <span className="w-1 h-1 rounded-full bg-white/60" />
      {label}
    </span>
  );
}

const ROOM_ICONS: Record<string, string> = {
  'Квартира': '🏠', 'Офис': '🏢', 'Магазин': '🛍️',
  'Ресторан / кафе': '🍽️', 'Гостиница': '🏨',
  'Салон красоты': '💇', 'Медицинский центр': '🏥', 'Другое': '📋',
};

export default function Quotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes]   = useState<Quote[]>([]);
  const [statuses, setStatuses] = useState<QuoteStatus_[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch]   = useState('');
  const [changingStatus, setChangingStatus] = useState<{ quoteId: number; open: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    const params: Record<string, string> = { limit: '100' };
    if (filterStatus !== 'all') params.status = filterStatus;
    const [q, s] = await Promise.all([getQuotes(params), getStatuses()]);
    setQuotes(q.quotes || []);
    setStatuses(s.statuses || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const filtered = quotes.filter(q => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (q.number || '').toLowerCase().includes(s) ||
      (q.client_name || '').toLowerCase().includes(s) ||
      (q.client_phone || '').toLowerCase().includes(s) ||
      (q.client_company || '').toLowerCase().includes(s) ||
      (q.object_name || '').toLowerCase().includes(s)
    );
  });

  const handleStatusChange = async (quote: Quote, code: string) => {
    if (!quote.id) return;
    await updateQuote({ id: quote.id, status: code, comment: `Статус изменён: ${code}` });
    setChangingStatus(null);
    load();
  };

  const stats = statuses.map(s => ({
    ...s,
    count: quotes.filter(q => q.status === s.code).length,
  })).filter(s => s.count > 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[var(--neon)] text-sm hover:opacity-80 transition-opacity"
          >
            <Icon name="ArrowLeft" size={14} /> PRO-TREK
          </button>
          <div className="w-px h-4 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <Icon name="FileText" size={16} className="text-[var(--neon)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Мои счета</span>
            <span className="text-xs text-[var(--text-muted)] ml-1">({quotes.length})</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="neon-btn text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Icon name="Plus" size={12} /> Новый счёт
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Статистика по статусам */}
        {stats.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-6">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${
                filterStatus === 'all'
                  ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)] text-[var(--text-primary)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
              }`}
            >
              Все <span className="font-bold">{quotes.length}</span>
            </button>
            {stats.map(s => (
              <button
                key={s.code}
                onClick={() => setFilterStatus(s.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${
                  filterStatus === s.code
                    ? 'text-white border-transparent'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                }`}
                style={filterStatus === s.code
                  ? { backgroundColor: s.color, boxShadow: `0 0 12px ${s.color}55` }
                  : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
                <span className="font-bold">{s.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Поиск */}
        <div className="relative mb-5">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону, объекту, номеру счёта..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--neon)] transition-colors"
          />
        </div>

        {/* Список счётов */}
        {loading ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <div className="text-3xl mb-3 animate-spin inline-block">⚡</div>
            <div className="text-sm">Загружаю счета...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <div className="text-5xl mb-4">📋</div>
            <div className="text-base font-semibold text-[var(--text-secondary)] mb-2">Счётов пока нет</div>
            <div className="text-sm mb-6">Создайте первый счёт через конструктор</div>
            <button
              onClick={() => navigate('/')}
              className="neon-btn text-white font-semibold px-6 py-2.5 rounded-xl"
            >
              Создать счёт
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(q => (
              <div key={q.id} className="pro-card overflow-hidden hover:border-[rgba(61,90,254,0.3)] transition-all">
                <div className="flex items-stretch">
                  {/* Цветная полоска статуса */}
                  <div
                    className="w-1 flex-shrink-0"
                    style={{ backgroundColor: q.status_color || STATUS_COLORS[q.status] || '#6b7280' }}
                  />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Левая часть */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-[var(--neon)] font-semibold">
                            #{q.number || `ID-${q.id}`}
                          </span>
                          <StatusBadge
                            code={q.status}
                            label={q.status_label || q.status}
                            color={q.status_color}
                          />
                          {q.room_type && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {ROOM_ICONS[q.room_type] || '📋'} {q.room_type}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-base font-bold text-[var(--text-primary)]">
                            {q.client_name || '—'}
                          </span>
                          {q.client_phone && (
                            <span className="text-sm text-[var(--text-secondary)]">{q.client_phone}</span>
                          )}
                          {q.client_company && (
                            <span className="text-xs text-[var(--text-muted)]">{q.client_company}</span>
                          )}
                        </div>

                        {q.object_name && (
                          <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                            <Icon name="MapPin" size={10} />
                            {q.object_name}
                            {q.object_address && ` — ${q.object_address}`}
                          </div>
                        )}
                      </div>

                      {/* Правая часть */}
                      <div className="flex-shrink-0 text-right">
                        {q.total_amount && Number(q.total_amount) > 0 ? (
                          <div className="text-lg font-black neon-text">
                            {Number(q.total_amount).toLocaleString('ru')} ₽
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--text-muted)]">без суммы</div>
                        )}
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {q.updated_at ? new Date(q.updated_at).toLocaleDateString('ru', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          }) : ''}
                        </div>
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={() => navigate('/', { state: { quoteId: q.id } })}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1.5 rounded-lg hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all"
                      >
                        <Icon name="Pencil" size={11} /> Редактировать
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setChangingStatus(
                            changingStatus?.quoteId === q.id
                              ? null
                              : { quoteId: q.id!, open: true }
                          )}
                          className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1.5 rounded-lg hover:border-[var(--text-muted)] transition-all"
                        >
                          <Icon name="RefreshCw" size={11} /> Статус
                          <Icon name="ChevronDown" size={10} />
                        </button>
                        {changingStatus?.quoteId === q.id && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden min-w-[180px] animate-fadein">
                            {statuses.map(s => (
                              <button
                                key={s.code}
                                onClick={() => handleStatusChange(q, s.code)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-secondary)] transition-colors ${
                                  q.status === s.code ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                {s.label}
                                {q.status === s.code && <Icon name="Check" size={10} className="ml-auto text-[var(--neon)]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-auto text-[10px] text-[var(--text-muted)]">
                        ID: {q.id}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Закрыть дропдаун кликом вне */}
      {changingStatus && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setChangingStatus(null)}
        />
      )}
    </div>
  );
}
