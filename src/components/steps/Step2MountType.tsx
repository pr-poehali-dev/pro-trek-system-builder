import { useState } from 'react';
import { ProjectState, MountType } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';

interface Props { state: ProjectState; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const CATALOG_IMG = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/0b607444-c50c-46fa-8b5a-3774ea8c555c.png';

const TYPES: { id: MountType; title: string; sub: string; img: string }[] = [
  { id: 'surface',  title: 'Накладные',  sub: 'На поверхность',  img: CATALOG_IMG },
  { id: 'built_in', title: 'Для ГКЛ',   sub: 'Встраиваемые',    img: CATALOG_IMG },
  { id: 'harpoon',  title: 'Для ПВХ',   sub: 'Гарпунные',       img: CATALOG_IMG },
  { id: 'other',    title: 'Подвесные', sub: 'Другие варианты',  img: CATALOG_IMG },
];

export default function Step2MountType({ state, next, back, totalSteps }: Props) {
  const [mount, setMount] = useState<MountType | null>(state.mountType);

  const handleSelect = (id: MountType) => {
    setMount(id);
    // Сразу переходим при выборе карточки — напряжение пока не фильтруем
    next({ mountType: id, voltage: null });
  };

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
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

      </div>
    </div>
  );
}
