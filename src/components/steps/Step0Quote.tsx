import { useState, useEffect } from 'react';
import { ProjectState, Quote, QuoteStatus_ } from '@/lib/types';
import { createQuote, updateQuote, getStatuses, getQuotes } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  state: ProjectState;
  update: (p: Partial<ProjectState>) => void;
  next: (p?: Partial<ProjectState>) => void;
}

const ROOM_TYPES = [
  { label: 'Квартира', icon: '🏠' },
  { label: 'Офис', icon: '💼' },
  { label: 'Магазин', icon: '🛍️' },
  { label: 'Ресторан / кафе', icon: '🍽️' },
  { label: 'Гостиница', icon: '🏨' },
  { label: 'Салон красоты', icon: '💅' },
  { label: 'Медицинский центр', icon: '🏥' },
  { label: 'Другое', icon: '📋' },
];

const SESSION_ID = `s_${Math.random().toString(36).slice(2, 10)}`;

function StatusBadge({ code, label, color, active, onClick }: {
  code: string; label: string; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
        active
          ? 'border-transparent text-white shadow-lg scale-105'
          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
      }`}
      style={active ? { backgroundColor: color, boxShadow: `0 0 14px ${color}55` } : {}}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: active ? 'rgba(255,255,255,0.8)' : color }}
      />
      {label}
    </button>
  );
}

export default function Step0Quote({ state, update, next }: Props) {
  const [form, setForm] = useState<Quote>({
    status: 'draft',
    client_name: '',
    client_phone: '',
    client_email: '',
    client_company: '',
    object_name: '',
    object_address: '',
    room_type: '',
    manager_name: '',
    notes: '',
    ...(state.quote || {}),
  });
  const [statuses, setStatuses] = useState<QuoteStatus_[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getStatuses().then(r => setStatuses(r.statuses || []));
    getQuotes({ limit: '5' }).then(r => setRecentQuotes(r.quotes || []));
  }, []);

  const set = (key: keyof Quote, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    setSaved(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.client_name?.trim()) e.client_name = 'Укажите имя заказчика';
    if (!form.client_phone?.trim()) e.client_phone = 'Укажите телефон';
    return e;
  };

  const handleSave = async (andNext = false) => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, session_id: SESSION_ID };
      let result;
      if (form.id) {
        await updateQuote({ ...payload, id: form.id });
        result = { id: form.id, number: form.number };
      } else {
        result = await createQuote(payload);
        setForm(f => ({ ...f, id: result.id, number: result.number }));
      }
      const savedQuote = { ...form, id: result.id, number: result.number };
      update({ quote: savedQuote });
      setSaved(true);
      if (andNext) next({ quote: savedQuote });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (code: QuoteStatus_['code']) => {
    setForm(f => ({ ...f, status: code }));
    setSaved(false);
    if (form.id) {
      await updateQuote({ id: form.id, status: code, comment: `Статус изменён на: ${code}` });
      setSaved(true);
    }
  };

  const loadQuote = (q: Quote) => {
    setForm({ ...q });
    update({ quote: q });
    setShowRecent(false);
  };

  const Field = ({ label, field, placeholder, type = 'text', required = false, icon }: {
    label: string; field: keyof Quote; placeholder?: string; type?: string; required?: boolean; icon?: string;
  }) => (
    <div className="relative">
      <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={14} className="text-white/25" />
          </div>
        )}
        <input
          type={type}
          value={(form[field] as string) || ''}
          onChange={e => set(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[var(--bg-primary)] border text-white placeholder:text-white/25 ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${
            errors[field]
              ? 'border-red-500 focus:border-red-400'
              : 'border-white/10 focus:border-[var(--neon)] focus:shadow-[0_0_0_3px_rgba(61,90,254,0.1)]'
          }`}
        />
      </div>
      {errors[field] && (
        <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1">
          <Icon name="AlertCircle" size={10} />
          {errors[field]}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] animate-fadein">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Заголовок */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              {form.number ? (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-[var(--neon)] flex items-center justify-center shadow-[0_0_20px_var(--neon-glow)]">
                    <Icon name="FileText" size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Счёт</div>
                    <div className="text-xl font-black text-[var(--text-primary)] font-mono">#{form.number}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--neon)] to-[#6c63ff] flex items-center justify-center shadow-[0_0_20px_var(--neon-glow)]">
                    <Icon name="Plus" size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Новый счёт</div>
                    <div className="text-xl font-black text-[var(--text-primary)]">Данные заказа</div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {recentQuotes.length > 0 && (
              <button
                onClick={() => setShowRecent(!showRecent)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                  showRecent
                    ? 'border-[var(--neon)] text-[var(--neon)] bg-[rgba(61,90,254,0.05)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--neon)] hover:text-[var(--neon)]'
                }`}
              >
                <Icon name="History" size={12} /> Последние ({recentQuotes.length})
              </button>
            )}
          </div>
        </div>

        {/* Недавние счета */}
        {showRecent && (
          <div className="pro-card mb-6 overflow-hidden animate-fadein border-[var(--neon)] shadow-[0_0_20px_rgba(61,90,254,0.1)]">
            <div className="px-4 py-3 bg-[rgba(61,90,254,0.05)] border-b border-[var(--border)] flex items-center gap-2">
              <Icon name="History" size={13} className="text-[var(--neon)]" />
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Недавние счета</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {recentQuotes.map(q => (
                <button
                  key={q.id}
                  onClick={() => loadQuote(q)}
                  className="w-full px-4 py-3.5 flex items-center gap-4 text-left hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-secondary)] group-hover:bg-[var(--neon)] flex items-center justify-center transition-colors">
                    <Icon name="FileText" size={13} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[var(--neon)]">#{q.number}</span>
                      {q.status_color && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: q.status_color }}>
                          {q.status_label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--text-primary)] mt-0.5 font-medium">{q.client_name || '—'}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{q.object_name || q.client_company || ''}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {q.total_amount && (
                      <div className="text-sm font-bold text-[var(--text-primary)]">{Number(q.total_amount).toLocaleString('ru')} ₽</div>
                    )}
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {q.updated_at ? new Date(q.updated_at).toLocaleDateString('ru') : ''}
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-[var(--text-muted)] group-hover:text-[var(--neon)] transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Статусы */}
        <div className="pro-card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Tag" size={13} className="text-[var(--neon)]" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Статус счёта</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map(s => (
              <StatusBadge
                key={s.code}
                code={s.code}
                label={s.label}
                color={s.color}
                active={form.status === s.code}
                onClick={() => handleStatusChange(s.code as QuoteStatus_['code'])}
              />
            ))}
          </div>
        </div>

        {/* Основные блоки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          {/* Заказчик */}
          <div className="pro-card p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
              <div className="w-8 h-8 rounded-xl bg-[rgba(61,90,254,0.12)] flex items-center justify-center">
                <Icon name="User" size={14} className="text-[var(--neon)]" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Заказчик</span>
            </div>
            <Field label="Имя / ФИО" field="client_name" placeholder="Иван Иванов" required icon="User" />
            <Field label="Телефон" field="client_phone" placeholder="+7 900 000-00-00" type="tel" required icon="Phone" />
            <Field label="Email" field="client_email" placeholder="email@example.com" type="email" icon="Mail" />
            <Field label="Компания" field="client_company" placeholder="ООО Ромашка" icon="Building" />
            <Field label="Адрес заказчика" field="client_address" placeholder="г. Москва, ул. Ленина, 1" icon="MapPin" />
          </div>

          {/* Объект */}
          <div className="pro-card p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
              <div className="w-8 h-8 rounded-xl bg-[rgba(61,90,254,0.12)] flex items-center justify-center">
                <Icon name="Building2" size={14} className="text-[var(--neon)]" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Объект</span>
            </div>
            <Field label="Название объекта" field="object_name" placeholder="ЖК Солнечный, кв. 42" icon="Home" />
            <Field label="Адрес объекта" field="object_address" placeholder="г. Москва, ул. Садовая, 5" icon="MapPin" />

            <div>
              <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-2 block">Тип помещения</label>
              <div className="grid grid-cols-2 gap-1.5">
                {ROOM_TYPES.map(rt => (
                  <button
                    key={rt.label}
                    onClick={() => set('room_type', rt.label)}
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border transition-all text-left ${
                      form.room_type === rt.label
                        ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.12)] text-white font-semibold'
                        : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'
                    }`}
                  >
                    <span className="text-sm">{rt.icon}</span>
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Менеджер" field="manager_name" placeholder="Имя менеджера" icon="UserCheck" />
          </div>
        </div>

        {/* Примечания */}
        <div className="pro-card p-5 mb-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)] mb-4">
            <div className="w-8 h-8 rounded-xl bg-[rgba(61,90,254,0.12)] flex items-center justify-center">
              <Icon name="FileText" size={14} className="text-[var(--neon)]" />
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)]">Примечания</span>
          </div>
          <textarea
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="Особые пожелания, комментарии к заказу..."
            rows={3}
            className="w-full bg-[var(--bg-primary)] border border-white/10 text-white placeholder:text-white/25 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[var(--neon)] focus:shadow-[0_0_0_3px_rgba(61,90,254,0.1)] transition-all resize-none"
          />
        </div>

        {/* История */}
        {form.id && (state.quote as Quote & { history?: { status_label: string; status_color: string; changed_at: string; comment: string }[] })?.history?.length ? (
          <div className="pro-card overflow-hidden mb-5">
            <div className="px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center gap-2">
              <Icon name="Clock" size={13} className="text-[var(--text-muted)]" />
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">История изменений</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {((state.quote as Quote & { history?: { status_label: string; status_color: string; changed_at: string; comment: string }[] })?.history || []).map((h, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white flex-shrink-0" style={{ backgroundColor: h.status_color || '#6b7280' }}>
                    {h.status_label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] flex-1">{h.comment}</span>
                  <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{new Date(h.changed_at).toLocaleString('ru')}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Кнопки */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {saved && (
              <div className="flex items-center gap-1.5 text-xs text-green-400 animate-fadein">
                <Icon name="CheckCircle" size={14} /> Сохранено
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] px-5 py-2.5 rounded-xl text-sm hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all disabled:opacity-50"
            >
              <Icon name="Save" size={14} />
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="neon-btn flex items-center gap-2 text-white font-bold px-7 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              Начать подбор
              <Icon name="ArrowRight" size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}