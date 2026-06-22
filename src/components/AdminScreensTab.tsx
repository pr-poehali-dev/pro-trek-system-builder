import { useRef } from 'react';
import { usePersistedImages } from '@/lib/usePersistedImages';
import Icon from '@/components/ui/icon';

// ─── Конфиг всех экранов и карточек ───────────────────────────────────────────
const SCREENS = [
  {
    key: 'step1',
    label: 'Экран 1 — Категория',
    cards: [
      { id: 'track',    label: 'Трековые системы' },
      { id: 'lighting', label: 'Освещение' },
    ],
    defaults: {
      track:    'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/8763863c-56c9-4039-8798-8fbdda6397f9.gif',
      lighting: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/32bf3982-cce5-44a4-aa29-14568c42a34e.gif',
    },
  },
  {
    key: 'step2',
    label: 'Экран 2 — Тип установки',
    cards: [
      { id: 'surface',  label: 'Универсальные' },
      { id: 'harpoon',  label: 'Гарпунные' },
      { id: 'other',    label: 'На поверхность' },
      { id: 'built_in', label: 'Для гипсокартона' },
    ],
    defaults: {
      surface:  'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3cfb2024-bbbd-495a-80d1-6c5c6b022b83.png',
      harpoon:  'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/9c09c460-9b9e-425e-8534-428039ef84f8.jpg',
      other:    'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/81e9c27a-3c8e-4ae1-90a2-a0bde00b0a62.jpg',
      built_in: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/582d9509-9eb3-455b-9ce2-147380a6b679.jpg',
    },
  },
  {
    key: 'step3',
    label: 'Экран 3 — Формы трека',
    cards: [
      { id: 'straight', label: 'Прямая' },
      { id: 'l_shaped', label: 'Г-образная' },
      { id: 's_shaped', label: 'С-образная' },
      { id: 'u_shaped', label: 'П-образная' },
      { id: 'closed',   label: 'Замкнутая' },
    ],
    defaults: {
      straight: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/9727971c-bc23-41d9-bd0b-23f710886c8f.png',
      l_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/ab8036a8-9cf5-4364-a03e-e296799b0c8f.png',
      s_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/cfb8a087-e087-4a47-976c-8c9d25474d56.png',
      u_shaped: 'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/3b53500a-286f-46a8-a75b-1b94e1f4de4f.png',
      closed:   'https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/1b14201f-d874-4cd9-bb01-891b4fe8ac06.png',
    },
  },
];

// ─── Строка таблицы ────────────────────────────────────────────────────────────
function ImageRow({ cardId, label, src, onReplace }: {
  cardId: string; label: string; src: string; onReplace: (id: string, url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      onReplace(cardId, url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors group">
      {/* Превью */}
      <div className="w-16 h-12 rounded-lg overflow-hidden bg-[var(--bg-secondary)] flex-shrink-0 border border-[var(--border)]">
        <img src={src} alt={label} className="w-full h-full object-cover" />
      </div>

      {/* Название */}
      <div className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{label}</div>

      {/* URL (укорочен) */}
      <div className="hidden md:block flex-1 text-[10px] text-[var(--text-muted)] font-mono truncate max-w-[200px]">
        {src.split('/').pop()}
      </div>

      {/* Кнопка загрузки */}
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all flex-shrink-0"
      >
        <Icon name="Upload" size={12} />
        Заменить
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── Блок одного экрана ────────────────────────────────────────────────────────
function ScreenBlock({ screen }: { screen: typeof SCREENS[0] }) {
  const { images, setImage } = usePersistedImages(screen.key, screen.defaults);

  return (
    <div className="pro-card overflow-hidden mb-4">
      <div className="px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center gap-2">
        <Icon name="LayoutGrid" size={13} className="text-[var(--neon)]" />
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">{screen.label}</span>
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">{screen.cards.length} карточки</span>
      </div>
      <div>
        {screen.cards.map(card => (
          <ImageRow
            key={card.id}
            cardId={card.id}
            label={card.label}
            src={images[card.id] ?? screen.defaults[card.id as keyof typeof screen.defaults]}
            onReplace={setImage}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Главный компонент вкладки ─────────────────────────────────────────────────
export default function AdminScreensTab() {
  return (
    <div>
      <div className="flex items-start gap-2 p-3 rounded-xl border border-[var(--neon)]/20 bg-[var(--neon)]/5 mb-4">
        <Icon name="Info" size={14} className="text-[var(--neon)] flex-shrink-0 mt-0.5" />
        <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          Загрузите картинки для каждой карточки. Изменения сохраняются мгновенно и отображаются на всех экранах.
        </div>
      </div>

      {SCREENS.map(screen => (
        <ScreenBlock key={screen.key} screen={screen} />
      ))}
    </div>
  );
}
