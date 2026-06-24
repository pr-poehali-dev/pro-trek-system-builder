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
      // Мержим: дефолты + серверные (серверные побеждают только если есть)
      setImages(Object.keys(serverImages).length > 0
        ? { ...defaults, ...serverImages }
        : defaults
      );
      setReady(true);
    }).catch(() => {
      // При ошибке остаёмся на дефолтах
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