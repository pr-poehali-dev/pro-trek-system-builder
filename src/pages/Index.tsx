import { useState, useCallback } from 'react';
import { ProjectState } from '@/lib/types';
import Step1Start from '@/components/steps/Step1Start';
import Step2MountType from '@/components/steps/Step2MountType';
import Step3Constructor from '@/components/steps/Step3Constructor';
import Step4Constructions from '@/components/steps/Step4Constructions';
import Step5Suppliers from '@/components/steps/Step5Suppliers';
import Step6Luminaires from '@/components/steps/Step6Luminaires';
import Step7Electrical from '@/components/steps/Step7Electrical';
import Step8Final from '@/components/steps/Step8Final';
import AdminPanel from '@/components/AdminPanel';

const TOTAL_STEPS = 8;

const initState: ProjectState = {
  step: 1,
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

export default function Index() {
  const [state, setState] = useState<ProjectState>(initState);
  const [showAdmin, setShowAdmin] = useState(false);

  const update = useCallback((patch: Partial<ProjectState>) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const next = useCallback((patch?: Partial<ProjectState>) => {
    setState(s => ({ ...s, ...(patch || {}), step: Math.min(s.step + 1, TOTAL_STEPS) }));
  }, []);

  const back = useCallback(() => {
    setState(s => ({ ...s, step: Math.max(s.step - 1, 1) }));
  }, []);

  const reset = useCallback(() => setState(initState), []);

  const stepProps = { state, update, next, back, reset, totalSteps: TOTAL_STEPS };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
          <div className="w-8 h-8 rounded-lg neon-border flex items-center justify-center animate-pulse-neon">
            <span className="text-xs font-black neon-text font-mono">PT</span>
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)] tracking-wider">
              PRO<span className="neon-text">-TREK</span>
            </div>
            <div className="text-[9px] text-[var(--text-muted)] tracking-widest uppercase">Track System Constructor</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {state.step > 1 && (
            <div className="hidden sm:flex gap-1 items-center">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i < state.step
                      ? 'w-2 h-2 bg-[var(--neon)] shadow-[0_0_6px_var(--neon-glow)]'
                      : 'w-1.5 h-1.5 bg-[var(--border)]'
                  }`}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--neon)]"
          >
            ⚙ Каталог
          </button>
          {state.step > 1 && (
            <button
              onClick={reset}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors px-2 py-1 rounded border border-[var(--border)]"
            >
              ✕ Сброс
            </button>
          )}
        </div>
      </header>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      <main className="flex-1 overflow-auto">
        {state.step === 1 && <Step1Start {...stepProps} />}
        {state.step === 2 && <Step2MountType {...stepProps} />}
        {state.step === 3 && <Step3Constructor {...stepProps} />}
        {state.step === 4 && <Step4Constructions {...stepProps} />}
        {state.step === 5 && <Step5Suppliers {...stepProps} />}
        {state.step === 6 && <Step6Luminaires {...stepProps} />}
        {state.step === 7 && <Step7Electrical {...stepProps} />}
        {state.step === 8 && <Step8Final {...stepProps} />}
      </main>
    </div>
  );
}
