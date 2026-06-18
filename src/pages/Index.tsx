import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectState, Quote } from '@/lib/types';
import Step0Quote from '@/components/steps/Step0Quote';
import Step1Start from '@/components/steps/Step1Start';
import Step2MountType from '@/components/steps/Step2MountType';
import Step3Constructor from '@/components/steps/Step3Constructor';
import Step4Constructions from '@/components/steps/Step4Constructions';
import Step5SystemSelect from '@/components/steps/Step5SystemSelect';
import Step6Accessories from '@/components/steps/Step6Accessories';
import Step7Luminaires from '@/components/steps/Step6Luminaires';
import Step7Electrical from '@/components/steps/Step7Electrical';
import Step8Final from '@/components/steps/Step8Final';
import AdminPanel from '@/components/AdminPanel';
import Icon from '@/components/ui/icon';

const TOTAL_STEPS = 9; // шаги 1–9, шаг 0 отдельный

const initState: ProjectState = {
  step: 0,
  quote: null,
  trackType: null,
  mountType: null,
  voltage: null,
  color: null,
  supplierCode: 'arlight',
  constructions: [],
  spec: [],
  summary: null,
  selectedLuminaires: [],
  angleChoices: {},
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280', new: '#3d5afe', in_progress: '#f59e0b',
  sent: '#8b5cf6', approved: '#10b981', ordered: '#06b6d4',
  completed: '#00e676', cancelled: '#ef4444',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик', new: 'Новый', in_progress: 'В работе',
  sent: 'Отправлен', approved: 'Согласован', ordered: 'Заказан',
  completed: 'Выполнен', cancelled: 'Отменён',
};

export default function Index() {
  const navigate = useNavigate();
  const [state, setState] = useState<ProjectState>(initState);
  const [showAdmin, setShowAdmin] = useState(false);

  const update = useCallback((patch: Partial<ProjectState>) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const next = useCallback((patch?: Partial<ProjectState>) => {
    setState(s => ({ ...s, ...(patch || {}), step: s.step + 1 }));
  }, []);

  const back = useCallback(() => {
    setState(s => ({ ...s, step: Math.max(s.step - 1, 0) }));
  }, []);

  const reset = useCallback(() => setState(initState), []);

  const goToStep = useCallback((step: number) => {
    setState(s => ({ ...s, step }));
  }, []);

  const stepProps = { state, update, next, back, reset, totalSteps: TOTAL_STEPS };

  const quote = state.quote as Quote | null;
  const statusCode = quote?.status || 'draft';
  const statusColor = STATUS_COLORS[statusCode] || '#6b7280';
  const statusLabel = quote?.status_label || STATUS_LABELS[statusCode] || 'Черновик';

  // Навигационные точки (только шаги 1–8)
  const visibleStep = state.step; // 0 = нулевой экран

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-40">

        {/* Лого */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
          <div className="w-7 h-7 rounded-lg neon-border flex items-center justify-center animate-pulse-neon">
            <span className="text-[10px] font-black neon-text font-mono">PT</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-[var(--text-primary)] tracking-wider leading-none">
              PRO<span className="neon-text">-TREK</span>
            </div>
            <div className="text-[8px] text-[var(--text-muted)] tracking-widest uppercase">Constructor</div>
          </div>
        </div>

        {/* Центр: номер счёта + статус */}
        {quote && (
          <div className="flex items-center gap-2 animate-fadein">
            <button
              onClick={() => goToStep(0)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--neon)] transition-all group"
            >
              <Icon name="FileText" size={12} className="text-[var(--text-muted)] group-hover:text-[var(--neon)]" />
              <span className="text-xs font-mono text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                {quote.number || 'Черновик'}
              </span>
            </button>
            <button
              onClick={() => goToStep(0)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-all hover:opacity-80"
              style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}55` }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse"
              />
              {statusLabel}
            </button>
            {quote.client_name && (
              <span className="hidden md:block text-xs text-[var(--text-muted)] max-w-[140px] truncate">
                {quote.client_name}
              </span>
            )}
          </div>
        )}

        {/* Правая часть */}
        <div className="flex items-center gap-2">
          {/* Прогресс точки (шаги 1–8) */}
          {visibleStep >= 1 && (
            <div className="hidden sm:flex gap-1 items-center">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i + 1)}
                  title={`Шаг ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i + 1 < visibleStep
                      ? 'w-2 h-2 bg-[var(--neon)] shadow-[0_0_4px_var(--neon-glow)] hover:scale-125'
                      : i + 1 === visibleStep
                      ? 'w-2.5 h-2.5 bg-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)]'
                      : 'w-1.5 h-1.5 bg-[var(--border)] hover:bg-[var(--text-muted)]'
                  }`}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/quotes')}
            className="hidden sm:flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--neon)]"
          >
            <Icon name="List" size={11} /> Мои счета
          </button>

          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className={`flex items-center gap-1.5 text-[10px] transition-colors px-2.5 py-1 rounded border hover:border-[var(--neon)] hover:text-[var(--neon)] ${
              showAdmin
                ? 'border-[var(--neon)] text-[var(--neon)]'
                : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            ⚙ <span className={`hidden sm:inline font-semibold ${state.supplierCode === 'ego' ? 'text-amber-400' : ''}`}>
              {state.supplierCode === 'ego' ? 'EGO' : 'ARL'}
            </span>
          </button>

          {state.step > 0 && (
            <button
              onClick={reset}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors px-2 py-1 rounded border border-[var(--border)]"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          currentSupplier={state.supplierCode}
          onSupplierChange={(code) => {
            update({ supplierCode: code });
            setShowAdmin(false);
          }}
        />
      )}

      {/* ─── Steps ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {state.step === 0 && <Step0Quote state={state} update={update} next={next} />}
        {state.step === 1 && <Step1Start {...stepProps} />}
        {state.step === 2 && <Step2MountType {...stepProps} />}
        {state.step === 3 && <Step3Constructor {...stepProps} />}
        {state.step === 4 && <Step4Constructions {...stepProps} />}
        {state.step === 5 && <Step5SystemSelect {...stepProps} />}
        {state.step === 6 && <Step6Accessories {...stepProps} />}
        {state.step === 7 && <Step7Luminaires {...stepProps} />}
        {state.step === 8 && <Step7Electrical {...stepProps} />}
        {state.step === 9 && <Step8Final {...stepProps} />}
      </main>
    </div>
  );
}