interface Props {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
  onReplace?: (newUrl: string) => void;
}

import React from 'react';

export default function ImageUpload({ src, alt = '', className = '', imgClassName = 'w-full h-full object-cover', imgStyle }: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className={imgClassName}
        style={imgStyle}
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
      />
    </div>
  );
}