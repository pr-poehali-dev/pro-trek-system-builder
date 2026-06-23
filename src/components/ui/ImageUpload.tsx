import { useRef } from 'react';

interface Props {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  onReplace?: (newUrl: string) => void;
}

export default function ImageUpload({ src, alt = '', className = '', imgClassName = 'w-full h-full object-cover', onReplace }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (dataUrl && onReplace) onReplace(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`relative overflow-hidden group/imgup ${className}`}>
      <img
        src={src}
        alt={alt}
        className={imgClassName}
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
      />

      {onReplace && (
        <>
          <button
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/imgup:bg-black/40 transition-all opacity-0 group-hover/imgup:opacity-100"
            title="Заменить фото"
          >
            <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded-lg">
              📷 Заменить
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </>
      )}
    </div>
  );
}
