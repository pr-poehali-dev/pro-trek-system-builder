import { ProjectState } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';
import ImageUpload from '@/components/ui/ImageUpload';
import Icon from '@/components/ui/icon';
import { usePersistedImages } from '@/lib/usePersistedImages';
import { useState } from 'react';

interface Props { next: (p?: Partial<ProjectState>) => void; totalSteps: number; back: () => void; }

const DEFAULTS: Record<string, string> = {
  track: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/8763863c-56c9-4039-8798-8fbdda6397f9.gif',
  lighting: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/32bf3982-cce5-44a4-aa29-14568c42a34e.gif',
};

const CATEGORIES = [
  { id: 'track',    title: 'Трековые системы', sub: 'Треки, шинопроводы, комплектующие',  imgPos: 'object-left',  available: true,  badge: null,   accent: '#3d5afe' },
  { id: 'lighting', title: 'Освещение',        sub: 'Люстры, споты, декоративный свет',   imgPos: 'object-right', available: false, badge: 'Скоро', accent: '#f59e0b' },
];

export default function Step1Start({ next, totalSteps }: Props) {
  const { images, setImage } = usePersistedImages('step1', DEFAULTS);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSelect = (id: string, available: boolean) => {
    if (!available) return;
    if (id === 'track') next({ trackType: 'track' });
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={1} total={totalSteps} label="Категория" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-[var(--text-primary)]">Выберите категорию</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">Что будем подбирать?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CATEGORIES.map(cat => {
            const isHovered = hovered === cat.id;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered(null)}
                className={`relative pro-card overflow-hidden transition-all duration-300 ${
                  cat.available ? 'hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]' : 'opacity-70'
                } ${isHovered && cat.available ? 'border-[var(--neon)] shadow-[0_0_30px_var(--neon-glow)]' : ''}`}
              >
                {/* Зона фото: клик переходит, карандашик заменяет */}
                <div
                  className="relative h-48 overflow-hidden"
                  onClick={() => handleSelect(cat.id, cat.available)}
                  style={{ cursor: cat.available ? 'pointer' : 'default' }}
                >
                  <ImageUpload
                    src={images[cat.id]}
                    alt={cat.title}
                    className="w-full h-full"
                    imgClassName={`w-full h-full object-cover transition-transform duration-500 ${cat.imgPos} ${
                      isHovered && cat.available ? 'scale-110' : 'scale-100'
                    }`}
                    onReplace={url => setImage(cat.id, url)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent pointer-events-none" />
                  {cat.badge && (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: cat.accent }}>
                        {cat.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Нижний блок */}
                <div
                  onClick={() => handleSelect(cat.id, cat.available)}
                  className={`p-4 flex items-center justify-between ${cat.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <div>
                    <div className="font-black text-lg text-white leading-tight">{cat.title}</div>
                    <div className="text-xs text-white/50 mt-0.5">{cat.sub}</div>
                  </div>
                  {!cat.available ? (
                    <div className="flex-shrink-0 text-xs text-white/40 border border-white/10 px-2.5 py-1 rounded-full">В разработке</div>
                  ) : (
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isHovered ? 'scale-110 shadow-[0_0_12px_rgba(61,90,254,0.5)]' : ''}`}
                      style={{ backgroundColor: `${cat.accent}22`, border: `1.5px solid ${cat.accent}66` }}
                    >
                      <Icon name="ChevronRight" size={16} style={{ color: cat.accent }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}