import { useState, useEffect, useRef } from 'react';
import { getCardImages, saveCardImage } from '@/lib/api';

export function usePersistedImages(key: string, defaults: Record<string, string>) {
  const [images, setImages] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    getCardImages(key).then(serverImages => {
      setImages(serverImages);
      setReady(true);
    }).catch(() => {
      setReady(true);
    });
  }, [key]);

  const setImage = async (id: string, imageData: string) => {
    setImages(prev => ({ ...prev, [id]: imageData }));
    try {
      const cdnUrl = await saveCardImage(key, id, imageData);
      setImages(prev => ({ ...prev, [id]: cdnUrl }));
    } catch (e) { void e; }
  };

  return { images, setImage, ready };
}