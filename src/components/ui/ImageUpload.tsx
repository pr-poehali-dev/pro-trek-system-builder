import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  onReplace?: (newUrl: string) => void;
}

export default function ImageUpload({ src, alt = '', className = '', imgClassName = 'w-full h-full object-cover', onReplace }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      onReplace?.(url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  return (
    <div
      className={`relative group overflow-hidden ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDrop={e => { e.stopPropagation(); handleDrop(e); }}
      onDragOver={e => e.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        className={imgClassName}
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
      />

      {onReplace && (
        <>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); e.preventDefault(); inputRef.current?.click(); }}
            onMouseDown={e => e.stopPropagation()}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 border border-white/25 flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:bg-[var(--neon)] hover:border-[var(--neon)] hover:scale-110 z-20 ${
              hover ? 'opacity-100' : 'opacity-0'
            }`}
            title="Заменить фото"
          >
            <Icon name="Pencil" size={12} className="text-white" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onClick={e => e.stopPropagation()}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
        </>
      )}
    </div>
  );
}
