import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

const ALL_CATEGORIES = [
  { key: 'track',              label: 'Шинопровод',          emoji: '📏' },
  { key: 'head',               label: 'Светильники',         emoji: '💡' },
  { key: 'connector_straight', label: 'Соединители прямые',  emoji: '➡️' },
  { key: 'connector_angle',    label: 'Соединители угловые', emoji: '↩️' },
  { key: 'connector_flexible', label: 'Соединители гибкие',  emoji: '〰️' },
  { key: 'end_cap',            label: 'Заглушки',            emoji: '🔲' },
  { key: 'mount',              label: 'Крепёж / подвесы',    emoji: '🔗' },
  { key: 'power_inlet',        label: 'Токовводы',           emoji: '🔌' },
  { key: 'driver',             label: 'Блоки питания',       emoji: '⚡' },
  { key: 'controller',         label: 'Контроллеры',         emoji: '🎛️' },
  { key: 'base',               label: 'Базы / адаптеры',     emoji: '🔧' },
  { key: 'accessory',          label: 'Аксессуары',          emoji: '📦' },
];

const inputCls = "bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 placeholder:text-white/25 w-full";

export default function CategoriesTab({ onGoToCat, contextSeriesName }: { onGoToCat: (catKey: string, seriesName?: string) => void; contextSeriesName?: string }) {
  const [cats, setCats] = useState(ALL_CATEGORIES.map(c => ({ ...c, enabled: true, order: ALL_CATEGORIES.indexOf(c), imageUrl: '' })));
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (i: number) => {
    setEditIdx(i);
    setEditLabel(cats[i].label);
    setEditEmoji(cats[i].emoji);
    setEditImageUrl(cats[i].imageUrl ?? '');
  };

  const saveEdit = () => {
    if (editIdx === null) return;
    setCats(prev => prev.map((c, i) => i === editIdx ? { ...c, label: editLabel, emoji: editEmoji, imageUrl: editImageUrl } : c));
    setEditIdx(null);
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setEditImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addCat = () => {
    if (!newKey || !newLabel) return;
    setCats(prev => [...prev, { key: newKey.toLowerCase().replace(/\s+/g, '_'), label: newLabel, emoji: newEmoji || '📦', enabled: true, order: prev.length, imageUrl: '' }]);
    setNewKey(''); setNewLabel(''); setNewEmoji(''); setAddMode(false);
  };

  const toggle = (i: number) => setCats(prev => prev.map((c, idx) => idx === i ? { ...c, enabled: !c.enabled } : c));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {contextSeriesName ? (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-white/30">Категории системы</span>
            <Icon name="ChevronRight" size={13} className="text-white/20" />
            <span className="text-white font-semibold">{contextSeriesName}</span>
          </div>
        ) : (
          <span className="text-white/40 text-sm">{cats.filter(c => c.enabled).length} из {cats.length} активны</span>
        )}
        <button onClick={() => setAddMode(p => !p)}
          className="ml-auto flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[var(--neon)]/15 text-[var(--neon)] hover:bg-[var(--neon)]/25 transition-all font-medium">
          <Icon name="Plus" size={14} /> Новая категория
        </button>
      </div>

      {addMode && (
        <div className="flex items-center gap-2 mb-4 py-3 border-b border-white/8">
          <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="😀" className="w-14 text-center bg-white/6 text-white rounded-xl text-lg px-2 py-2 focus:outline-none" />
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Название категории *" className={inputCls} />
          <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="ключ (латиница)" className="bg-white/6 text-white rounded-xl text-sm px-3 py-2 focus:outline-none w-40 placeholder:text-white/25" />
          <button onClick={addCat} disabled={!newKey || !newLabel}
            className="neon-btn text-white text-sm px-4 py-2 rounded-xl font-semibold flex-shrink-0 disabled:opacity-40">
            Добавить
          </button>
          <button onClick={() => setAddMode(false)} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
            <Icon name="X" size={16} />
          </button>
        </div>
      )}

      {cats.map((cat, i) => (
        <div key={cat.key} className={`border-b border-white/5 last:border-0 ${!cat.enabled ? 'opacity-40' : ''}`}>
          <div className="flex items-center gap-3 py-3 group">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-white/5">
              {cat.imageUrl
                ? <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl leading-none">{cat.emoji}</span>
              }
            </div>

            {editIdx === i ? (
              <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                className="flex-1 bg-[#1e1e2e] text-white rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 border border-white/10" />
            ) : (
              <button onClick={() => onGoToCat(cat.key, contextSeriesName)}
                className={`flex-1 text-left text-sm font-medium transition-colors ${cat.enabled ? 'text-white hover:text-[var(--neon)]' : 'text-white/50'}`}>
                {cat.label}
              </button>
            )}

            <span className="text-xs text-white/20 font-mono w-36 truncate flex-shrink-0 hidden sm:block">{cat.key}</span>

            <div className="flex items-center gap-1 flex-shrink-0">
              {editIdx === i ? (
                <>
                  <button onClick={saveEdit} className="text-[var(--neon)] hover:opacity-70 p-1 transition-opacity"><Icon name="Check" size={15} /></button>
                  <button onClick={() => setEditIdx(null)} className="text-white/30 hover:text-white p-1 transition-colors"><Icon name="X" size={15} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => onGoToCat(cat.key, contextSeriesName)}
                    className="text-white/20 hover:text-[var(--neon)] p-1 transition-colors opacity-0 group-hover:opacity-100">
                    <Icon name="ArrowRight" size={14} />
                  </button>
                  <button onClick={() => startEdit(i)} className="text-white/20 hover:text-white p-1 transition-colors"><Icon name="Pencil" size={14} /></button>
                  <button onClick={() => toggle(i)}
                    className={`p-1 transition-colors ${cat.enabled ? 'text-white/20 hover:text-amber-400' : 'text-white/20 hover:text-green-400'}`}>
                    <Icon name={cat.enabled ? 'EyeOff' : 'Eye'} size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {editIdx === i && (
            <div className="mb-3 pl-13 flex gap-2 items-end">
              <div className="flex flex-col gap-1 flex-shrink-0">
                <span className="text-[10px] text-white/30 uppercase tracking-wide">Эмодзи</span>
                <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)}
                  placeholder="😀"
                  className="w-14 text-center bg-[#1e1e2e] text-white rounded-lg text-xl px-1 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 border border-white/10" />
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[10px] text-white/30 uppercase tracking-wide">Картинка</span>
                <div className="flex gap-2">
                  <input
                    value={editImageUrl}
                    onChange={e => setEditImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-[#1e1e2e] text-white rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--neon)]/40 border border-white/10 placeholder:text-white/20" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all flex-shrink-0 whitespace-nowrap">
                    <Icon name="Upload" size={13} /> Файл
                  </button>
                  {editImageUrl && (
                    <button onClick={() => setEditImageUrl('')} className="text-white/30 hover:text-white transition-colors flex-shrink-0 px-1">
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </div>
                {editImageUrl && (
                  <div className="mt-1 w-16 h-12 rounded-lg overflow-hidden border border-white/10">
                    <img src={editImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
