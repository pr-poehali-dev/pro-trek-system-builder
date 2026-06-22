import { useState, useEffect, useRef } from 'react';
import { getCardImages, saveCardImage } from '@/lib/api';

export function usePersistedImages(key: string, defaults: Record<string, string>) {
  const [images, setImages] = useState<Record<string, string>>(defaults);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    getCardImages(key).then(serverImages => {
      if (Object.keys(serverImages).length > 0) {
        setImages(prev => ({ ...prev, ...serverImages }));
      }
    });
  }, [key]);

  const setImage = async (id: string, imageData: string) => {
    setImages(prev => ({ ...prev, [id]: imageData }));
    try {
      const cdnUrl = await saveCardImage(key, id, imageData);
      setImages(prev => ({ ...prev, [id]: cdnUrl }));
    } catch (e) { void e; }
  };

  return { images, setImage };
}
