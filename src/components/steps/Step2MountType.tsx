import { useState } from 'react';
import { ProjectState, MountType } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';

interface Props { state: ProjectState; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const TYPES: { id: MountType; title: string; sub: string; desc: string }[] = [
  { id: 'surface',  title: 'Накладные',  sub: 'На поверхность',      desc: 'Монтаж на потолок или стену без утопания' },
  { id: 'built_in', title: 'Для ГКЛ',    sub: 'Встраиваемые',        desc: 'Утопленный монтаж в гипсокартон с фланцем' },
  { id: 'harpoon',  title: 'Для ПВХ',    sub: 'Гарпунные',           desc: 'Монтаж в натяжной потолок через гарпун' },
  { id: 'other',    title: 'Другие',      sub: 'Трековые системы',    desc: 'Подвесной и прочие варианты монтажа' },
];

const VOLTAGES = [{ v: 48, label: '48В', cls: 'badge-48v' }, { v: 220, label: '220В', cls: 'badge-220v' }];

const SHAPE_ICONS: Record<MountType, string> = {
  surface:  'M20,60 L80,60',
  built_in: 'M15,45 L85,45 M15,55 L85,55',
  harpoon:  'M20,50 L80,50 M50,30 L50,50',
  other:    'M20,40 L80,40 M20,60 L80,60',
};

export default function Step2MountType({ state, next, back, totalSteps }: Props) {
  const [mount, setMount] = useState<MountType | null>(state.mountType);
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setMount(t.id)}
              className={`pro-card overflow-hidden text-left transition-all duration-200 ${mount === t.id ? 'selected' : ''}`}
            >
              <div className="aspect-video bg-[var(--bg-secondary)] flex items-center justify-center">
                <svg width="80" height="48" viewBox="0 0 100 70" fill="none">
                  <path d={SHAPE_ICONS[t.id]} stroke={mount === t.id ? 'var(--neon)' : 'var(--text-muted)'}
                    strokeWidth="3" strokeLinecap="round"
                    style={mount === t.id ? { filter: 'drop-shadow(0 0 4px var(--neon-glow))' } : {}} />
                </svg>
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm text-[var(--text-primary)]">{t.title}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{t.sub}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Voltage */}
        <div className="pro-card p-4 mb-6">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Напряжение системы</div>
          <div className="flex gap-3">
            {VOLTAGES.map(({ v, label, cls }) => (
              <button
                key={v}
                onClick={() => setVoltage(v)}
                className={`px-5 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  voltage === v
                    ? 'border-[var(--neon)] bg-[rgba(61,90,254,0.1)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                }`}
              >
                <span className={cls}>{label}</span>
                <span className="ml-2 text-[var(--text-muted)] text-xs font-normal">
                  {v === 48 ? 'Магнитные MAG-серии' : 'Стандартные трековые'}
                </span>
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
