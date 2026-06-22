interface Props {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  onReplace?: (newUrl: string) => void;
}

export default function ImageUpload({ src, alt = '', className = '', imgClassName = 'w-full h-full object-cover' }: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className={imgClassName}
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
      />
    </div>
  );
}
