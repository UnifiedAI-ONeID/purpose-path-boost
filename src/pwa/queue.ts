export async function enqueueLead(payload: any) {
  const db = await openDB('zg-queue', 1);
  const tx = db.transaction('leads', 'readwrite');
  await tx.store.add({ payload, at: Date.now() });
  await tx.done;
  db.close();

  // Request background sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    try {
      await (reg as any).sync.register('leadSync');
    } catch { }
  }
}

type DBEx = IDBDatabase & { transaction: (n: string, mode: 'readwrite' | 'readonly') => any };

function openDB(name: string, version: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      const db = req.result as DBEx;
      if (!(db as any).objectStoreNames.contains('leads')) {
        (db as any).createObjectStore('leads', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(wrapDB(req.result));
    req.onerror = () => reject(req.error);
  });
}

function wrapDB(db: IDBDatabase) {
  return {
    transaction(store: string, mode: 'readwrite' | 'readonly') {
      const tx = db.transaction(store, mode);
      const st = tx.objectStore(store);
      return {
        store: {
          add: (v: any) => promisify(st.add(v)),
          getAll: () => promisify(st.getAll()),
          delete: (k: any) => promisify(st.delete(k))
        },
        done: new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        })
      };
    },
    close: () => db.close()
  };
}

function promisify(req: IDBRequest) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
