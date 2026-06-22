import { useState } from 'react';
import { ProjectState, MountType } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';
import ImageUpload from '@/components/ui/ImageUpload';
import Icon from '@/components/ui/icon';

interface Props { next: (p?: Partial<ProjectState>) => void; totalSteps: number; back: () => void; }

const DEFAULT_TRACK_TYPES = [
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

const DEFAULT_EXTRA_TYPES = [
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
  const [trackTypes, setTrackTypes] = useState(DEFAULT_TRACK_TYPES);
  const [extraTypes, setExtraTypes] = useState(DEFAULT_EXTRA_TYPES);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (id === 'help') return;
    const mount = (id === 'other2' ? 'other' : id) as MountType;
    next({ mountType: mount, trackType: 'track' });
  };

  const replaceImg = (list: typeof trackTypes, idx: number, url: string) => {
    const updated = [...list];
    updated[idx] = { ...updated[idx], img: url };
    return updated;
  };

  const allCards = [
    ...trackTypes.map((t, i) => ({ ...t, listIdx: i, listKey: 'track' as const })),
    ...extraTypes.map((t, i) => ({ ...t, listIdx: i, listKey: 'extra' as const })),
  ];

  return (
    <div className="animate-fadein">
      <ProgressBar current={1} total={totalSteps} label="Тип трека" />

      <div className="max-w-5xl mx-auto px-6 py-6">
        <button onClick={back} className="text-[var(--neon)] text-sm mb-6 hover:opacity-80 flex items-center gap-1.5 transition-opacity">
          <Icon name="ArrowLeft" size={14} /> К данным заказчика
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Выберите тип трека</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Наведите на карточку, чтобы заменить фото</p>
        </div>

        {/* Основные 4 карточки */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {trackTypes.map((t, i) => (
            <div
              key={t.id}
              className="relative pro-card overflow-hidden cursor-pointer group transition-all duration-200 hover:border-[var(--neon)] hover:shadow-[0_0_24px_var(--neon-glow)] hover:-translate-y-0.5"
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSelect(t.id)}
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
                <ImageUpload
                  src={t.img}
                  alt={t.title}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onReplace={url => setTrackTypes(prev => replaceImg(prev, i, url))}
                />
              </div>
              <div className="p-3.5 bg-[var(--bg-secondary)]">
                <div className="font-bold text-sm text-[var(--text-primary)]">{t.title}</div>
                <div className="text-xs text-[var(--neon)] mt-0.5 font-medium">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 2 дополнительные карточки */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {extraTypes.map((t, i) => (
            <div
              key={t.id}
              className={`relative pro-card overflow-hidden cursor-pointer group transition-all duration-200 hover:border-[var(--neon)] hover:shadow-[0_0_24px_var(--neon-glow)] hover:-translate-y-0.5 ${
                t.id === 'help' ? 'md:col-span-1' : 'md:col-span-1'
              }`}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSelect(t.id)}
            >
              <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
                <ImageUpload
                  src={t.img}
                  alt={t.title}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onReplace={url => setExtraTypes(prev => replaceImg(prev, i, url))}
                />
                {t.id === 'help' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(61,90,254,0.7)] to-transparent flex items-end p-3 pointer-events-none">
                    <span className="text-[10px] text-white font-semibold bg-[var(--neon)] px-2 py-0.5 rounded-full">Бесплатно</span>
                  </div>
                )}
              </div>
              <div className="p-3.5 bg-[var(--bg-secondary)]">
                <div className="font-bold text-sm text-[var(--text-primary)]">{t.title}</div>
                <div className={`text-xs mt-0.5 font-medium ${t.id === 'help' ? 'text-[var(--neon)]' : 'text-[var(--text-secondary)]'}`}>{t.sub}</div>
              </div>
            </div>
          ))}
          <div className="hidden md:block" />
          <div className="hidden md:block" />
        </div>
      </div>
    </div>
  );
}
