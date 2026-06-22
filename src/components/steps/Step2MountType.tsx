import { useState } from 'react';
import { ProjectState, MountType } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';
import ImageUpload from '@/components/ui/ImageUpload';
import Icon from '@/components/ui/icon';
import { usePersistedImages } from '@/lib/usePersistedImages';

interface Props { state: ProjectState; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const TYPES: { id: MountType; title: string; sub: string }[] = [
  { id: 'surface',  title: 'Универсальные',     sub: 'На поверхность'   },
  { id: 'harpoon',  title: 'Гарпунные',         sub: 'Натяжной потолок' },
  { id: 'other',    title: 'На поверхность',    sub: 'Накладной монтаж' },
  { id: 'built_in', title: 'Для гипсокартона', sub: 'Встраиваемые'     },
];

const DEFAULTS: Record<string, string> = {
  surface:  'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3cfb2024-bbbd-495a-80d1-6c5c6b022b83.png',
  harpoon:  'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/9c09c460-9b9e-425e-8534-428039ef84f8.jpg',
  other:    'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/81e9c27a-3c8e-4ae1-90a2-a0bde00b0a62.jpg',
  built_in: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/582d9509-9eb3-455b-9ce2-147380a6b679.jpg',
};

export default function Step2MountType({ state, next, back, totalSteps }: Props) {
  const [mount, setMount] = useState<MountType | null>(state.mountType);
  const { images, setImage, ready } = usePersistedImages('step2', DEFAULTS);

  const handleSelect = (id: MountType) => {
    setMount(id);
    next({ mountType: id, voltage: null });
  };

  return (
    <div className="animate-fadein">
      <ProgressBar current={2} total={totalSteps} label="Тип установки" />
      <div className="max-w-5xl mx-auto px-6 py-6">

        <button onClick={back} className="text-[var(--neon)] text-sm mb-6 hover:opacity-80 flex items-center gap-1.5 transition-opacity">
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Выберите тип установки</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Наведите на карточку, чтобы заменить фото</p>
        </div>

        {!ready && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-52 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        )}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!ready ? 'hidden' : ''}`}>
          {TYPES.map(t => (
            <div
              key={t.id}
              className={`relative pro-card overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 ${
                mount === t.id
                  ? 'selected shadow-[0_0_24px_var(--neon-glow)] border-[var(--neon)]'
                  : 'hover:border-[rgba(61,90,254,0.5)] hover:shadow-[0_0_16px_rgba(61,90,254,0.15)]'
              }`}
            >
              {/* Фото — клик переходит, карандашик заменяет */}
              <div
                className="aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)] relative cursor-pointer"
                onClick={() => handleSelect(t.id)}
              >
                <ImageUpload
                  src={images[t.id]}
                  alt={t.title}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onReplace={url => setImage(t.id, url)}
                />

              </div>
              {/* Нижний блок */}
              <div
                onClick={() => handleSelect(t.id)}
                className={`p-3.5 cursor-pointer transition-colors ${mount === t.id ? 'bg-[rgba(61,90,254,0.06)]' : 'bg-[var(--bg-secondary)]'}`}
              >
                <div className="font-bold text-sm text-[var(--text-primary)]">{t.title}</div>
                <div className={`text-xs mt-0.5 font-medium ${mount === t.id ? 'text-[var(--neon)]' : 'text-[var(--text-secondary)]'}`}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}