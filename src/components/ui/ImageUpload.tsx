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
  const [localSrc, setLocalSrc] = useState(src);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      setLocalSrc(url);
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
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <img
        src={localSrc}
        alt={alt}
        className={imgClassName}
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
      />

      {onReplace && (
        <>
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-200 cursor-pointer ${
              hover ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Icon name="Camera" size={16} className="text-white" />
            </div>
            <span className="text-white text-[10px] font-semibold">Заменить фото</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </>
      )}
    </div>
  );
}
