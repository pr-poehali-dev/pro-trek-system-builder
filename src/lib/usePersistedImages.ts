import { useState } from 'react';

function loadStored(key: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(`img_${key}`) || '{}'); }
  catch (e) { void e; return {}; }
}

function saveStored(key: string, data: Record<string, string>) {
  try { localStorage.setItem(`img_${key}`, JSON.stringify(data)); }
  catch (e) { void e; }
}

export function usePersistedImages(key: string, defaults: Record<string, string>) {
  const [images, setImages] = useState<Record<string, string>>(() => ({
    ...defaults,
    ...loadStored(key),
  }));

  const setImage = (id: string, url: string) => {
    setImages(prev => {
      const next = { ...prev, [id]: url };
      saveStored(key, next);
      return next;
    });
  };

  return { images, setImage };
}
