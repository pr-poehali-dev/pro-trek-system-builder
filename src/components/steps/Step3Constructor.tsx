import { useState } from 'react';
import { ProjectState, ShapeType, Construction, ShapeDims } from '@/lib/types';
import { SHAPE_META, calcConstruction } from '@/lib/shapes';
import ProgressBar from '@/components/ProgressBar';
import ShapeSVG from '@/components/ShapeSVG';

interface Props { state: ProjectState; update: (p: Partial<ProjectState>) => void; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const SHAPES: ShapeType[] = ['straight', 'l_shaped', 's_shaped', 'u_shaped', 'closed'];

// Г-образная форма на потолке (реальное фото из проекта)
const L_PHOTO = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/95fc1943-4862-4c4d-bc8f-75a68ac6cf3c.png';

const SHAPE_PHOTOS: Record<ShapeType, string> = {
  straight: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/eeb22d65-9e09-415e-b006-18c93c47f12a.jpg',
  l_shaped: L_PHOTO,
  s_shaped: L_PHOTO,
  u_shaped: L_PHOTO,
  closed:   'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/ea81197c-1c08-45d7-ab2b-1dfa04843e93.jpg',
  custom:   L_PHOTO,
};

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
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm mx-4 overflow-hidden animate-fadein shadow-2xl">
        {/* Заголовок модалки */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Добавить конструкцию</span>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--border)] transition-all"
          >✕</button>
        </div>

        {/* Фото конструкции (точно как в скриншоте) */}
        <div className="relative h-48 overflow-hidden bg-[var(--bg-secondary)]">
          <img
            src={SHAPE_PHOTOS[shape]}
            alt={meta.label}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Overlay с SVG схемой если фото не загрузилось */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ShapeSVG shape={shape} size={100} color="rgba(255,255,255,0.15)" />
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-5">{meta.label}</h3>

          <div className="space-y-4">
            {meta.fields.map(f => (
              <div key={f.key}>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={(dims as Record<string, number>)[f.key] ?? 2}
                  onChange={e => setDims(d => ({ ...d, [f.key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--neon)] text-sm transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:border-[var(--text-muted)] transition-colors flex items-center justify-center gap-2"
            >
              ✕ Отмена
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 neon-btn text-white text-sm py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
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

        <div className="flex justify-center mb-5">
          <button onClick={back} className="text-[var(--neon)] text-sm hover:opacity-80 flex items-center gap-1 transition-opacity border border-[var(--border)] px-4 py-1.5 rounded-lg">
            ← Назад
          </button>
        </div>

        <div className="pro-card p-4 mb-6 flex items-center gap-3">
          <span className="text-[var(--neon)] text-xl font-bold">+</span>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Добавляйте необходимую форму</h2>
        </div>

        {/* Карточки форм — точно как на скриншоте: светлый фон, фото, название снизу */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {SHAPES.map(shape => (
            <button
              key={shape}
              onClick={() => setActiveShape(shape)}
              className="group flex flex-col rounded-2xl overflow-hidden border-2 border-transparent hover:border-[var(--neon)] transition-all duration-200 hover:shadow-lg hover:shadow-[var(--neon-glow)]"
            >
              {/* Фото на светлом фоне */}
              <div className="aspect-square bg-[#d8d9e0] overflow-hidden relative">
                <img
                  src={SHAPE_PHOTOS[shape]}
                  alt={SHAPE_META[shape].label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    const parent = el.parentElement;
                    if (parent) parent.classList.add('flex', 'items-center', 'justify-center');
                  }}
                />
                {/* SVG fallback overlay всегда видна поверх */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShapeSVG shape={shape} size={64} color="#1a1a2e" />
                </div>
              </div>
              {/* Название */}
              <div className="bg-[#d8d9e0] py-2 px-2 group-hover:bg-white transition-colors">
                <span className="text-[10px] font-bold text-[#1a1a2e] tracking-wider uppercase block text-center">
                  {SHAPE_META[shape].label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {state.constructions.length > 0 && (
          <div className="mt-8 animate-fadein flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)]">
              Добавлено: <span className="text-[var(--neon)] font-semibold">{state.constructions.length}</span> конструкций
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