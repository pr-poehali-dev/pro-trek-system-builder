import { useState } from 'react';
import { ProjectState, MountType } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';
import ImageUpload from '@/components/ui/ImageUpload';
import Icon from '@/components/ui/icon';

interface Props { state: ProjectState; next: (p?: Partial<ProjectState>) => void; back: () => void; totalSteps: number; }

const CATALOG_IMG = 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/0b607444-c50c-46fa-8b5a-3774ea8c555c.png';

const DEFAULT_TYPES: { id: MountType; title: string; sub: string; img: string }[] = [
  { id: 'surface',  title: 'Накладные',  sub: 'На поверхность',  img: CATALOG_IMG },
  { id: 'built_in', title: 'Для ГКЛ',   sub: 'Встраиваемые',    img: CATALOG_IMG },
  { id: 'harpoon',  title: 'Для ПВХ',   sub: 'Гарпунные',       img: CATALOG_IMG },
  { id: 'other',    title: 'Подвесные', sub: 'Другие варианты',  img: CATALOG_IMG },
];

export default function Step2MountType({ state, next, back, totalSteps }: Props) {
  const [mount, setMount] = useState<MountType | null>(state.mountType);
  const [types, setTypes] = useState(DEFAULT_TYPES);

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {types.map((t, i) => (
            <div
              key={t.id}
              className={`relative pro-card overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 ${
                mount === t.id
                  ? 'selected shadow-[0_0_24px_var(--neon-glow)] border-[var(--neon)]'
                  : 'hover:border-[rgba(61,90,254,0.5)] hover:shadow-[0_0_16px_rgba(61,90,254,0.15)]'
              }`}
            >
              {/* Фото — только карандашик */}
              <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)] relative">
                <ImageUpload
                  src={t.img}
                  alt={t.title}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onReplace={url => setTypes(prev => {
                    const upd = [...prev];
                    upd[i] = { ...upd[i], img: url };
                    return upd;
                  })}
                />
                {mount === t.id && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[var(--neon)] flex items-center justify-center shadow-[0_0_10px_var(--neon-glow)] pointer-events-none">
                    <Icon name="Check" size={12} className="text-white" />
                  </div>
                )}
              </div>
              {/* Нижний блок — клик для выбора */}
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