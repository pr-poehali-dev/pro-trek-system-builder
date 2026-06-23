import { useState } from 'react';
import { ProjectState, Construction, ShapeDims, ShapeType } from '@/lib/types';
import { SHAPE_META, calcConstruction, formatDims } from '@/lib/shapes';
import { calculateSpec } from '@/lib/api';
import ProgressBar from '@/components/ProgressBar';
import ShapeSVG from '@/components/ShapeSVG';
import Icon from '@/components/ui/icon';
import { usePersistedImages } from '@/lib/usePersistedImages';

const SHAPE_PHOTOS_DEFAULT: Record<string, string> = {
  straight: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/9727971c-bc23-41d9-bd0b-23f710886c8f.png',
  l_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/ab8036a8-9cf5-4364-a03e-e296799b0c8f.png',
  s_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/cfb8a087-e087-4a47-976c-8c9d25474d56.png',
  u_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3b53500a-286f-46a8-a75b-1b94e1f4de4f.png',
  closed:   'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/1b14201f-d874-4cd9-bb01-891b4fe8ac06.png',
  custom:   'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/1c642422-3c66-423b-a0cf-625ff221cc18.png',
};

interface Props { state: ProjectState; update: (p: Partial<ProjectState>) => void; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

function EditDimsModal({ construction, onSave, onClose }: {
  construction: Construction;
  onSave: (dims: ShapeDims) => void;
  onClose: () => void;
}) {
  const meta = SHAPE_META[construction.shape];
  const [dims, setDims] = useState<ShapeDims>(construction.dims);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm mx-4 overflow-hidden animate-fadein">
        <div className="relative bg-[var(--bg-secondary)] h-40 flex items-center justify-center">
          <ShapeSVG shape={construction.shape} size={100} />
          <button onClick={onClose} className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-white w-7 h-7 flex items-center justify-center rounded-full border border-[var(--border)] transition-all">✕</button>
        </div>
        <div className="p-5">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-5">{meta.label}</h3>
          <div className="space-y-4">
            {meta.fields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">{f.label}</label>
                <input
                  type="number" step="0.1" min="0.1"
                  value={(dims as Record<string, number>)[f.key] ?? 2}
                  onChange={e => setDims(d => ({ ...d, [f.key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[var(--neon)] text-sm transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:border-[var(--text-muted)] transition-colors">✕ Отмена</button>
            <button onClick={() => onSave(dims)} className="flex-1 neon-btn text-white text-sm py-2.5 rounded-xl font-semibold">✓ Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Step4Constructions({ state, update, next, back, totalSteps }: Props) {
  const [editing, setEditing] = useState<Construction | null>(null);
  const [loading, setLoading] = useState(false);
  const { images: shapePhotos } = usePersistedImages('step3', SHAPE_PHOTOS_DEFAULT);

  const totalLength = state.constructions.reduce((s, c) => s + c.totalLength, 0);
  const totalCorners = state.constructions.reduce((s, c) => s + c.cornersCount, 0);

  const remove = (id: string) => update({ constructions: state.constructions.filter(c => c.id !== id) });
  const removeAll = () => update({ constructions: [] });

  const saveEdit = (dims: ShapeDims) => {
    if (!editing) return;
    const calc = calcConstruction(editing.shape, dims);
    const updated = state.constructions.map(c =>
      c.id === editing.id ? { ...c, dims, ...calc } : c
    );
    update({ constructions: updated });
    setEditing(null);
  };

  const handleCalc = async () => {
    setLoading(true);
    try {
      const body = {
        constructions: state.constructions.map(c => ({ shape: c.shape, dims: c.dims })),
        supplier_code: state.supplierCode,
        voltage: state.voltage,
        mount_type: state.mountType,
      };
      const res = await calculateSpec(body);
      update({ spec: res.spec || [], summary: res.summary || null });
      next();
    } catch (e) {
      alert('Ошибка расчёта. Убедитесь что каталог загружен.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={4} total={totalSteps} label="Конструкции" />
      <div className="max-w-4xl mx-auto px-6 py-4">

        {/* Summary header — тёмно-синяя шапка как на скриншоте */}
        <div className="flex items-center justify-between mb-4 bg-[#0d1035] px-4 py-3 rounded-xl border border-[#1e2560]">
          <div className="text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-semibold">Конструкций: {state.constructions.length}</span>
            <span className="mx-2 text-[var(--border)]">|</span>
            <span>Общая длина: <strong className="text-[var(--text-primary)]">{totalLength.toFixed(2)} м</strong></span>
            <span className="mx-2 text-[var(--border)]">|</span>
            <span>Углов: <strong className="text-[var(--text-primary)]">{totalCorners} шт.</strong></span>
          </div>
          {state.constructions.length > 0 && (
            <button onClick={removeAll} className="flex items-center gap-1.5 text-xs text-[var(--danger)] hover:opacity-80 transition-opacity">
              <Icon name="Trash2" size={14} /> Убрать все
            </button>
          )}
        </div>

        <div className="flex gap-3 mb-5">
          <button onClick={back} className="text-[var(--neon)] text-sm hover:opacity-80 flex items-center gap-1 transition-opacity">
            ← Назад
          </button>
          <button
            onClick={() => back()}
            className="flex items-center gap-2 text-sm border border-[var(--border)] text-[var(--text-secondary)] px-4 py-1.5 rounded-lg hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all"
          >
            <Icon name="Plus" size={14} /> Добавить форму
          </button>
        </div>

        {state.constructions.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <div className="text-4xl mb-3">📐</div>
            <div className="text-sm">Конструкций пока нет. Нажмите «Добавить форму».</div>
          </div>
        ) : (
          <div className="space-y-3">
            {state.constructions.map((c, i) => (
              <div key={c.id} className="pro-card p-4 animate-fadein">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Конструкция {i + 1}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(c)}
                      className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1 rounded-lg hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all"
                    >
                      <Icon name="Pencil" size={12} /> Размеры
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      className="flex items-center gap-1.5 text-xs text-[var(--danger)] border border-[var(--border)] px-3 py-1 rounded-lg hover:border-[var(--danger)] transition-all"
                    >
                      <Icon name="Trash2" size={12} /> Удалить
                    </button>
                  </div>
                </div>
                {/* Картинка на всю ширину */}
                <div className="w-full h-40 bg-[#c8cad4] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={shapePhotos[c.shape as ShapeType] ?? SHAPE_PHOTOS_DEFAULT[c.shape]}
                    alt={SHAPE_META[c.shape].label}
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Инфо под картинкой */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text-primary)] text-sm">{SHAPE_META[c.shape].label}</div>
                    <div className="text-[var(--text-secondary)] text-xs mt-0.5">{formatDims(c)}</div>
                    <div className="flex gap-3 mt-1 text-[10px] text-[var(--text-muted)]">
                      <span>Длина: {c.totalLength} м</span>
                      <span>Углов: {c.cornersCount}</span>
                      {c.isClosed && <span className="text-[var(--neon)]">Замкнута</span>}
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {state.constructions.length > 0 && (
          <div className="mt-6 flex justify-end animate-fadein">
            <button
              onClick={handleCalc}
              disabled={loading}
              className="neon-btn text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><span className="animate-spin">⚡</span> Рассчитываю...</>
              ) : (
                <>Рассчитать комплектующие →</>
              )}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <EditDimsModal construction={editing} onSave={saveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}