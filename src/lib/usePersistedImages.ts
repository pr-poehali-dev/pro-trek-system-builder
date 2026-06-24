import { useState, useEffect, useRef } from 'react';
import { getCardImages, saveCardImage } from '@/lib/api';

export function usePersistedImages(key: string, defaults: Record<string, string>) {
  // Стартуем сразу с дефолтами — картинки видны мгновенно, без мигания
  const [images, setImages] = useState<Record<string, string>>(defaults);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    getCardImages(key).then(serverImages => {
      // Обновляем только те ключи, у которых серверный URL реально отличается от дефолта
      const diff: Record<string, string> = {};
      for (const k of Object.keys(serverImages)) {
        if (serverImages[k] && serverImages[k] !== defaults[k]) {
          diff[k] = serverImages[k];
        }
      }
      if (Object.keys(diff).length > 0) {
        setImages(prev => ({ ...prev, ...diff }));
      }
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