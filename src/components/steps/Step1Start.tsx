import { ProjectState, MountType } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';

interface Props { state: ProjectState; next: (p?: Partial<ProjectState>) => void; totalSteps: number; update: (p: Partial<ProjectState>) => void; back: () => void; reset: () => void; }

// Фото из скриншота пользователя + реальные изображения
const TRACK_TYPES: { id: MountType; title: string; sub: string; img: string }[] = [
  {
    id: 'other',
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
    id: 'surface',
    title: 'Подвесные',
    sub: 'Другие варианты',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3d46a643-20c8-4d4c-9f87-57930c65369f.png',
  },
];

const EXTRA_TYPES = [
  {
    id: 'other2',
    title: 'Другие',
    sub: 'Трековые системы',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/eeb22d65-9e09-415e-b006-18c93c47f12a.jpg',
  },
  {
    id: 'help',
    title: 'Помощь в выборе',
    sub: 'Не теряйте время',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/files/ea81197c-1c08-45d7-ab2b-1dfa04843e93.jpg',
  },
];

export default function Step1Start({ next, back, totalSteps }: Props) {
  const handleSelect = (id: string) => {
    if (id === 'help') return;
    const mount = (id === 'other2' ? 'other' : id) as MountType;
    next({ mountType: mount, trackType: 'track' });
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={1} total={totalSteps} label="Тип трека" />

      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-5 hover:opacity-80 flex items-center gap-1 transition-opacity">
          ← К данным заказчика
        </button>
        <div className="pro-card p-4 mb-6">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Выберите Тип трека</h2>
        </div>

        {/* Top row — 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {TRACK_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className="pro-card overflow-hidden text-left group transition-all duration-200 hover:border-[var(--neon)] hover:shadow-[0_0_20px_var(--neon-glow)] cursor-pointer"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)] relative">
                <img
                  src={t.img}
                  alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="p-3 bg-white">
                <div className="font-bold text-sm text-[#111]">{t.title}</div>
                <div className="text-xs text-[#666] mt-0.5">{t.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom row — 2 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {EXTRA_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className={`pro-card overflow-hidden text-left group transition-all duration-200 ${
                t.id === 'help'
                  ? 'hover:border-[var(--neon)] hover:shadow-[0_0_20px_var(--neon-glow)]'
                  : 'hover:border-[var(--neon)] hover:shadow-[0_0_20px_var(--neon-glow)]'
              } cursor-pointer`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)] relative">
                <img
                  src={t.img}
                  alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="p-3 bg-white">
                <div className="font-bold text-sm text-[#111]">{t.title}</div>
                <div className="text-xs text-[#666] mt-0.5">{t.sub}</div>
              </div>
            </button>
          ))}
          {/* Spacers for grid alignment */}
          <div className="hidden md:block" />
          <div className="hidden md:block" />
        </div>
      </div>
    </div>
  );
}