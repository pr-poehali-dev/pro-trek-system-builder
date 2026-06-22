import { useState, useEffect, useRef } from 'react';

// IndexedDB — без лимита на размер, надёжнее localStorage для base64
const DB_NAME = 'app_images';
const STORE = 'images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key: string): Promise<Record<string, string>> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || {});
      req.onerror = () => resolve({});
    });
  } catch { return {}; }
}

async function dbSet(key: string, data: Record<string, string>) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, key);
  } catch (e) { void e; }
}

export function usePersistedImages(key: string, defaults: Record<string, string>) {
  const [images, setImages] = useState<Record<string, string>>(defaults);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    dbGet(key).then(stored => {
      if (Object.keys(stored).length > 0) {
        setImages(prev => ({ ...prev, ...stored }));
      }
    });
  }, [key]);

  const setImage = (id: string, url: string) => {
    setImages(prev => {
      const next = { ...prev, [id]: url };
      dbSet(key, next);
      return next;
    });
  };

  return { images, setImage };
}
