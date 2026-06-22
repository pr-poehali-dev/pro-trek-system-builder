import { useState } from 'react';
import { ProjectState } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';
import ImageUpload from '@/components/ui/ImageUpload';
import Icon from '@/components/ui/icon';

interface Props { next: (p?: Partial<ProjectState>) => void; totalSteps: number; back: () => void; }

const CATEGORIES = [
  {
    id: 'track',
    title: 'Трековые системы',
    sub: 'Треки, шинопроводы, комплектующие',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/6b348685-8118-491d-94e6-d4fd550a3c29.png',
    imgSide: 'left' as const,
    available: true,
    badge: null,
    accent: '#3d5afe',
  },
  {
    id: 'lighting',
    title: 'Освещение',
    sub: 'Люстры, споты, декоративный свет',
    img: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/6b348685-8118-491d-94e6-d4fd550a3c29.png',
    imgSide: 'right' as const,
    available: false,
    badge: 'Скоро',
    accent: '#f59e0b',
  },
];

export default function Step1Start({ next, back, totalSteps }: Props) {
  const [images, setImages] = useState<Record<string, string>>({});
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
            const imgSrc = images[cat.id] ?? cat.img;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(cat.id, cat.available)}
                className={`relative pro-card overflow-hidden group transition-all duration-300 ${
                  cat.available
                    ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
                    : 'cursor-not-allowed opacity-70'
                } ${
                  hovered === cat.id && cat.available
                    ? 'border-[var(--neon)] shadow-[0_0_30px_var(--neon-glow)]'
                    : ''
                }`}
              >
                {/* Картинка */}
                <div className="relative h-48 overflow-hidden">
                  <ImageUpload
                    src={imgSrc}
                    alt={cat.title}
                    className="w-full h-full"
                    imgClassName={`w-full h-full object-cover transition-transform duration-500 ${
                      hovered === cat.id && cat.available ? 'scale-110' : 'scale-100'
                    } ${cat.imgSide === 'right' ? 'object-right' : 'object-left'}`}
                    onReplace={url => setImages(prev => ({ ...prev, [cat.id]: url }))}
                  />
                  {/* Тёмный градиент снизу */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent pointer-events-none" />

                  {/* Бейдж */}
                  {cat.badge && (
                    <div className="absolute top-3 right-3 z-10">
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: cat.accent }}
                      >
                        {cat.badge}
                      </span>
                    </div>
                  )}

                  {/* Стрелка перехода */}
                  {cat.available && (
                    <div
                      className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        hovered === cat.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      }`}
                      style={{ backgroundColor: cat.accent }}
                    >
                      <Icon name="ArrowRight" size={14} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Контент */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        className="font-black text-lg text-white leading-tight"
                      >
                        {cat.title}
                      </div>
                    </div>
                    <div className="text-xs text-white/50">{cat.sub}</div>
                  </div>

                  {!cat.available && (
                    <div className="flex-shrink-0 text-xs text-white/40 border border-white/10 px-2.5 py-1 rounded-full">
                      В разработке
                    </div>
                  )}
                  {cat.available && (
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        hovered === cat.id ? 'scale-110' : ''
                      }`}
                      style={{ backgroundColor: `${cat.accent}22`, border: `1px solid ${cat.accent}55` }}
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