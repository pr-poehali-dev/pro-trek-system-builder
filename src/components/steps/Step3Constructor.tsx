import { useState } from 'react';
import { ProjectState, ShapeType, Construction, ShapeDims } from '@/lib/types';
import { SHAPE_META, calcConstruction } from '@/lib/shapes';
import ProgressBar from '@/components/ProgressBar';
import ShapeSVG from '@/components/ShapeSVG';
import ImageUpload from '@/components/ui/ImageUpload';
import Icon from '@/components/ui/icon';
import { usePersistedImages } from '@/lib/usePersistedImages';

interface Props { state: ProjectState; update: (p: Partial<ProjectState>) => void; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const SHAPES: ShapeType[] = ['straight', 'l_shaped', 's_shaped', 'u_shaped', 'closed'];

const DEFAULT_SHAPE_PHOTOS: Record<ShapeType, string> = {
  straight: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/9727971c-bc23-41d9-bd0b-23f710886c8f.png',
  l_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/ab8036a8-9cf5-4364-a03e-e296799b0c8f.png',
  s_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/cfb8a087-e087-4a47-976c-8c9d25474d56.png',
  u_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3b53500a-286f-46a8-a75b-1b94e1f4de4f.png',
  closed:   'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/1b14201f-d874-4cd9-bb01-891b4fe8ac06.png',
  custom:   'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/1c642422-3c66-423b-a0cf-625ff221cc18.png',
};

function AddShapeModal({ shape, photo, onAdd, onClose, onReplacePhoto }: {
  shape: ShapeType;
  photo: string;
  onAdd: (c: Construction) => void;
  onClose: () => void;
  onReplacePhoto: (url: string) => void;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm pb-8 px-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm mx-4 overflow-hidden animate-fadein shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[var(--neon)] flex items-center justify-center">
              <Icon name="Plus" size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)]">Добавить конструкцию</span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--border)] transition-all"
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        <div className="relative h-44 overflow-hidden bg-[var(--bg-secondary)]">
          <ImageUpload
            src={photo}
            alt={meta.label}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover"
            onReplace={onReplacePhoto}
          />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-card)] to-transparent pointer-events-none" />
        </div>

        <div className="p-5">
          <h3 className="text-xl font-black text-[var(--text-primary)] mb-4">{meta.label}</h3>

          <div className="space-y-3">
            {meta.fields.map(f => (
              <div key={f.key}>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDims(d => ({ ...d, [f.key]: Math.max(0.1, ((d as Record<string, number>)[f.key] ?? 2) - 0.5) }))}
                    className="w-9 h-9 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all flex items-center justify-center flex-shrink-0"
                  >−</button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={(dims as Record<string, number>)[f.key] ?? 2}
                    onChange={e => setDims(d => ({ ...d, [f.key]: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--neon)] text-sm text-center font-semibold transition-all"
                  />
                  <button
                    onClick={() => setDims(d => ({ ...d, [f.key]: ((d as Record<string, number>)[f.key] ?? 2) + 0.5 }))}
                    className="w-9 h-9 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all flex items-center justify-center flex-shrink-0"
                  >+</button>
                  <span className="text-xs text-[var(--text-muted)] w-4">м</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:border-[var(--text-muted)] transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 neon-btn text-white text-sm py-2.5 rounded-xl font-bold"
            >
              Добавить →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step3Constructor({ state, update, next, back, totalSteps }: Props) {
  const [activeShape, setActiveShape] = useState<ShapeType | null>(null);
  const { images: shapePhotos, setImage: setShapePhoto } = usePersistedImages('step3', DEFAULT_SHAPE_PHOTOS as Record<string, string>);

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

        <button onClick={back} className="text-[var(--neon)] text-sm mb-6 hover:opacity-80 flex items-center gap-1.5 transition-opacity">
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--neon)] flex items-center justify-center shadow-[0_0_12px_var(--neon-glow)]">
            <Icon name="Plus" size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Добавляйте необходимую форму</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Наведите на карточку, чтобы заменить фото</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {SHAPES.map(shape => (
            <div
              key={shape}
              className="group relative flex flex-col rounded-2xl overflow-hidden border-2 border-transparent hover:border-[var(--neon)] transition-all duration-200 hover:shadow-[0_0_20px_var(--neon-glow)] hover:-translate-y-1"
            >
              {/* Фото — клик открывает модалку, карандашик заменяет */}
              <div
                className="aspect-[4/3] bg-[#c8cad4] overflow-hidden relative cursor-pointer"
                onClick={() => setActiveShape(shape)}
              >
                <ImageUpload
                  src={shapePhotos[shape]}
                  alt={SHAPE_META[shape].label}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onReplace={url => setShapePhoto(shape, url)}
                />
              </div>
              {/* Плашка с названием */}
              <div
                onClick={() => setActiveShape(shape)}
                className="bg-[#c8cad4] group-hover:bg-[var(--neon)] py-2.5 px-2 transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-black text-[#1a1a2e] group-hover:text-white tracking-wider uppercase block text-center transition-colors">
                  {SHAPE_META[shape].label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {state.constructions.length > 0 && (
          <div className="mt-8 animate-fadein flex items-center justify-between pro-card p-4">
            <div className="flex items-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-[var(--neon)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                Добавлено: <strong className="text-[var(--text-primary)]">{state.constructions.length}</strong> конструкций
              </span>
            </div>
            <button onClick={next} className="neon-btn text-white font-bold px-6 py-2 rounded-xl text-sm">
              Далее →
            </button>
          </div>
        )}
      </div>

      {activeShape && (
        <AddShapeModal
          shape={activeShape}
          photo={shapePhotos[activeShape]}
          onAdd={handleAdd}
          onClose={() => setActiveShape(null)}
          onReplacePhoto={url => setShapePhoto(activeShape, url)}
        />
      )}
    </div>
  );
}