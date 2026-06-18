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
  'Квартира', 'Офис', 'Магазин', 'Ресторан / кафе',
  'Гостиница', 'Салон красоты', 'Медицинский центр', 'Другое',
];

const SESSION_ID = `s_${Math.random().toString(36).slice(2, 10)}`;

function StatusBadge({ code, label, color, active, onClick }: {
  code: string; label: string; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
        active
          ? 'border-transparent text-white shadow-lg scale-105'
          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
      }`}
      style={active ? { backgroundColor: color, boxShadow: `0 0 12px ${color}66` } : {}}
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

  const Field = ({ label, field, placeholder, type = 'text', required = false }: {
    label: string; field: keyof Quote; placeholder?: string; type?: string; required?: boolean;
  }) => (
    <div>
      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">
        {label} {required && <span className="text-[var(--danger)]">*</span>}
      </label>
      <input
        type={type}
        value={(form[field] as string) || ''}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[var(--bg-secondary)] border text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
          errors[field]
            ? 'border-[var(--danger)]'
            : 'border-[var(--border)] focus:border-[var(--neon)]'
        }`}
      />
      {errors[field] && <div className="text-[10px] text-[var(--danger)] mt-1">{errors[field]}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] animate-fadein">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Заголовок */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="text-2xl font-black text-[var(--text-primary)]">
                {form.number
                  ? <><span className="text-[var(--text-muted)] font-mono text-lg">#{form.number}</span></>
                  : 'Новый счёт'}
              </div>
              {form.id && (
                <span className="text-[10px] text-[var(--neon)] border border-[var(--neon)] px-2 py-0.5 rounded-full font-mono">
                  ID {form.id}
                </span>
              )}
            </div>
            <div className="text-sm text-[var(--text-muted)]">Заполните данные заказчика и объекта</div>
          </div>
          <div className="flex gap-2">
            {recentQuotes.length > 0 && (
              <button
                onClick={() => setShowRecent(!showRecent)}
                className="flex items-center gap-1.5 text-xs border border-[var(--border)] text-[var(--text-secondary)] px-3 py-2 rounded-lg hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all"
              >
                <Icon name="History" size={12} /> Последние
              </button>
            )}
          </div>
        </div>

        {/* Недавние счета */}
        {showRecent && (
          <div className="pro-card mb-6 overflow-hidden animate-fadein">
            <div className="px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              Недавние счета
            </div>
            <div className="divide-y divide-[var(--border)]">
              {recentQuotes.map(q => (
                <button
                  key={q.id}
                  onClick={() => loadQuote(q)}
                  className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--neon)]">#{q.number}</span>
                      {q.status_color && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white"
                          style={{ backgroundColor: q.status_color }}
                        >
                          {q.status_label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--text-primary)] mt-0.5">{q.client_name || '—'}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{q.object_name || q.client_company || ''}</div>
                  </div>
                  <div className="text-right">
                    {q.total_amount && (
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {Number(q.total_amount).toLocaleString('ru')} ₽
                      </div>
                    )}
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {q.updated_at ? new Date(q.updated_at).toLocaleDateString('ru') : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Статусы */}
        <div className="pro-card p-4 mb-6">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
            Статус счёта
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Блок: Заказчик */}
          <div className="pro-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="User" size={14} className="text-[var(--neon)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">Заказчик</span>
            </div>
            <Field label="Имя / ФИО" field="client_name" placeholder="Иван Иванов" required />
            <Field label="Телефон" field="client_phone" placeholder="+7 900 000-00-00" type="tel" required />
            <Field label="Email" field="client_email" placeholder="email@example.com" type="email" />
            <Field label="Компания" field="client_company" placeholder="ООО Ромашка" />
            <Field label="Адрес заказчика" field="client_address" placeholder="г. Москва, ул. Ленина, 1" />
          </div>

          {/* Блок: Объект */}
          <div className="pro-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Building2" size={14} className="text-[var(--neon)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">Объект</span>
            </div>
            <Field label="Название объекта" field="object_name" placeholder="ЖК Солнечный, кв. 42" />
            <Field label="Адрес объекта" field="object_address" placeholder="г. Москва, ул. Садовая, 5" />

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Тип помещения</label>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map(rt => (
                  <button
                    key={rt}
                    onClick={() => set('room_type', rt)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      form.room_type === rt
                        ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)] text-[var(--text-primary)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {rt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Менеджер</label>
              <input
                type="text"
                value={form.manager_name || ''}
                onChange={e => set('manager_name', e.target.value)}
                placeholder="Имя менеджера"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[var(--neon)] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Примечания */}
        <div className="pro-card p-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="FileText" size={14} className="text-[var(--neon)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Примечания</span>
          </div>
          <textarea
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="Особые пожелания, комментарии к заказу..."
            rows={3}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[var(--neon)] transition-colors resize-none"
          />
        </div>

        {/* История (если счёт уже сохранён) */}
        {form.id && (state.quote as Quote & { history?: { status_label: string; status_color: string; changed_at: string; comment: string }[] })?.history?.length ? (
          <div className="pro-card overflow-hidden mt-5">
            <div className="px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">История изменений</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {((state.quote as Quote & { history?: { status_label: string; status_color: string; changed_at: string; comment: string }[] })?.history || []).map((h, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: h.status_color || '#6b7280' }}
                  >
                    {h.status_label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] flex-1">{h.comment}</span>
                  <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                    {new Date(h.changed_at).toLocaleString('ru')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Кнопки */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <div className="flex items-center gap-2">
            {saved && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--success)] animate-fadein">
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
              className="neon-btn text-white font-semibold px-8 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              Начать подбор →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
