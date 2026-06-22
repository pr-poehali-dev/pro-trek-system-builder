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
import Icon from '@/components/ui/icon';

const TOTAL_STEPS = 9;

const STEP_LABELS: Record<number, string> = {
  1: 'Категория', 2: 'Тип установки', 3: 'Конструктор',
  4: 'Конструкции', 5: 'Система', 6: 'Комплектующие',
  7: 'Светильники', 8: 'Электрика', 9: 'Итог',
};

const initState: ProjectState = {
  step: 1,
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
  const [showQuote, setShowQuote] = useState(false);

  const update = useCallback((patch: Partial<ProjectState>) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const next = useCallback((patch?: Partial<ProjectState>) => {
    setState(s => ({ ...s, ...(patch || {}), step: s.step + 1 }));
  }, []);

  const back = useCallback(() => {
    setState(s => ({ ...s, step: Math.max(s.step - 1, 1) }));
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
      <header className="sticky top-0 z-40 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 h-12">

          {/* Лого */}
          <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" onClick={reset}>
            <div className="w-7 h-7 rounded-lg neon-border flex items-center justify-center">
              <span className="text-[10px] font-black neon-text font-mono">PT</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-black text-white tracking-wider leading-none">
                PRO<span className="neon-text">-TREK</span>
              </div>
            </div>
          </div>

          {/* Центр: название текущего шага */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {visibleStep >= 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/30">{visibleStep}/{TOTAL_STEPS}</span>
                <span className="text-sm font-bold text-white">{STEP_LABELS[visibleStep]}</span>
              </div>
            )}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowQuote(true)}
              className={`flex items-center gap-1.5 text-[10px] font-semibold transition-all px-3 py-1.5 rounded-lg border ${
                quote
                  ? 'border-[var(--neon)] text-[var(--neon)] bg-[rgba(61,90,254,0.08)]'
                  : 'border-white/15 text-white/60 hover:border-[var(--neon)] hover:text-[var(--neon)]'
              }`}
            >
              <Icon name="FileText" size={11} />
              <span className="hidden sm:inline">Данные заказа</span>
            </button>

            <button
              onClick={() => navigate('/quotes')}
              className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30"
            >
              <Icon name="List" size={11} />
              <span>Мои счета</span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-white/60 hover:text-[var(--neon)] transition-colors px-3 py-1.5 rounded-lg border border-white/15 hover:border-[var(--neon)]"
            >
              <Icon name="Settings" size={11} />
              <span className="hidden sm:inline">Настройки</span>
            </button>

            <button
              onClick={reset}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/15 text-white/40 hover:text-white hover:border-white/30 transition-all text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      </header>



      {/* ─── Модалка: Данные заказа ─────────────────────────────────── */}
      {showQuote && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
          <div className="w-full max-w-4xl animate-fadein">
            <Step0Quote
              state={state}
              update={update}
              next={(patch) => { update(patch || {}); setShowQuote(false); }}
            />
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setShowQuote(false)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
              >
                <Icon name="X" size={12} /> Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Steps ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
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