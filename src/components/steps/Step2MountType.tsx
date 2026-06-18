import { useState } from 'react';
import { ProjectState, MountType } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';

interface Props { state: ProjectState; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const TYPES: { id: MountType; title: string; sub: string; img: string }[] = [
  {
    id: 'surface',
    title: 'Накладные',
    sub: 'На поверхность',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3d46a643-20c8-4d4c-9f87-57930c65369f.png',
  },
  {
    id: 'built_in',
    title: 'Для ГКЛ',
    sub: 'Встраиваемые',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3d46a643-20c8-4d4c-9f87-57930c65369f.png',
  },
  {
    id: 'harpoon',
    title: 'Для ПВХ',
    sub: 'Гарпунные',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3d46a643-20c8-4d4c-9f87-57930c65369f.png',
  },
  {
    id: 'other',
    title: 'Подвесные',
    sub: 'Другие варианты',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3d46a643-20c8-4d4c-9f87-57930c65369f.png',
  },
];

const VOLTAGES = [
  { v: 48,  label: '48В',  desc: 'Магнитные MAG-серии',      cls: 'badge-48v'  },
  { v: 220, label: '220В', desc: 'Стандартные трековые',      cls: 'badge-220v' },
];

export default function Step2MountType({ state, next, back, totalSteps }: Props) {
  const [mount, setMount]     = useState<MountType | null>(state.mountType);
  const [voltage, setVoltage] = useState<number | null>(state.voltage);

  return (
    <div className="animate-fadein">
      <ProgressBar current={2} total={totalSteps} label="Тип установки" />
      <div className="max-w-5xl mx-auto px-6 py-6">

        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1 transition-opacity">
          ← Назад
        </button>

        <div className="pro-card p-4 mb-6">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Выберите тип установки</h2>
        </div>

        {/* 4 карточки с фото */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setMount(t.id)}
              className={`pro-card overflow-hidden text-left group transition-all duration-200 ${
                mount === t.id
                  ? 'selected shadow-[0_0_20px_var(--neon-glow)]'
                  : 'hover:border-[rgba(61,90,254,0.4)]'
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)] relative">
                <img
                  src={t.img}
                  alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {mount === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--neon)] flex items-center justify-center text-white text-xs shadow-[0_0_8px_var(--neon-glow)]">
                    ✓
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm text-[var(--text-primary)]">{t.title}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{t.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Напряжение */}
        <div className="pro-card p-4 mb-6">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Напряжение системы</div>
          <div className="flex gap-3 flex-wrap">
            {VOLTAGES.map(({ v, label, desc, cls }) => (
              <button
                key={v}
                onClick={() => setVoltage(v)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border text-sm transition-all ${
                  voltage === v
                    ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)]'
                    : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                }`}
              >
                <span className={cls}>{label}</span>
                <span className="text-[var(--text-muted)] text-xs">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {mount && voltage && (
          <div className="flex justify-end animate-fadein">
            <button
              onClick={() => next({ mountType: mount, voltage })}
              className="neon-btn text-white font-semibold px-8 py-2.5 rounded-xl"
            >
              Продолжить →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}