import { useState } from 'react';
import { ProjectState, ShapeType, Construction, ShapeDims } from '@/lib/types';
import { SHAPE_META, calcConstruction } from '@/lib/shapes';
import ProgressBar from '@/components/ProgressBar';
import ShapeSVG from '@/components/ShapeSVG';

interface Props { state: ProjectState; update: (p: Partial<ProjectState>) => void; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const SHAPES: ShapeType[] = ['straight', 'l_shaped', 's_shaped', 'u_shaped', 'closed'];

function AddShapeModal({ shape, onAdd, onClose }: {
  shape: ShapeType;
  onAdd: (c: Construction) => void;
  onClose: () => void;
}) {
  const meta = SHAPE_META[shape];
  const [dims, setDims] = useState<ShapeDims>({ length: 2, width: 2, length2: 2 });

  const handleAdd = () => {
    const calc = calcConstruction(shape, dims);
    const construction: Construction = {
      id: `c_${Date.now()}`,
      shape,
      dims,
      ...calc,
    };
    onAdd(construction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm mx-4 overflow-hidden animate-fadein">
        {/* Preview */}
        <div className="relative bg-[var(--bg-secondary)] h-44 flex items-center justify-center">
          <ShapeSVG shape={shape} size={120} />
          <button onClick={onClose} className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-white w-7 h-7 flex items-center justify-center rounded-full border border-[var(--border)] hover:border-[var(--text-secondary)] transition-all">
            ✕
          </button>
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-5">{meta.label}</h3>

          <div className="space-y-4">
            {meta.fields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={(dims as Record<string, number>)[f.key] ?? 2}
                  onChange={e => setDims(d => ({ ...d, [f.key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[var(--neon)] text-sm transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:border-[var(--text-muted)] transition-colors"
            >
              ✕ Отмена
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 neon-btn text-white text-sm py-2.5 rounded-xl font-semibold"
            >
              ✓ Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step3Constructor({ state, update, next, back, totalSteps }: Props) {
  const [activeShape, setActiveShape] = useState<ShapeType | null>(null);

  const handleAdd = (c: Construction) => {
    const updated = [...state.constructions, c];
    update({ constructions: updated });
    setActiveShape(null);
    next();
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={3} total={totalSteps} label="Конструктор" />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1 transition-opacity">
          ← Назад
        </button>

        <div className="pro-card p-4 mb-6 flex items-center gap-3">
          <span className="text-[var(--neon)] text-lg">+</span>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Добавляйте необходимую форму</h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {SHAPES.map(shape => (
            <button
              key={shape}
              onClick={() => setActiveShape(shape)}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-[#e8eaf6] hover:bg-white transition-all duration-200 hover:shadow-lg hover:shadow-[var(--neon-glow)]"
            >
              <div className="w-20 h-20 flex items-center justify-center">
                <ShapeSVG shape={shape} size={72} color="#1a1a2e" />
              </div>
              <span className="text-[10px] font-bold text-[#1a1a2e] tracking-wider uppercase text-center leading-tight">
                {SHAPE_META[shape].label}
              </span>
            </button>
          ))}
        </div>

        {state.constructions.length > 0 && (
          <div className="mt-8 animate-fadein">
            <div className="text-xs text-[var(--text-muted)] mb-3">
              Добавлено конструкций: <span className="text-[var(--neon)] font-semibold">{state.constructions.length}</span>
            </div>
            <button
              onClick={next}
              className="neon-btn text-white font-semibold px-8 py-2.5 rounded-xl"
            >
              Просмотреть конструкции →
            </button>
          </div>
        )}
      </div>

      {activeShape && (
        <AddShapeModal
          shape={activeShape}
          onAdd={handleAdd}
          onClose={() => setActiveShape(null)}
        />
      )}
    </div>
  );
}
