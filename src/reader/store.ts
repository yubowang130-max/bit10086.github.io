// Tiny IndexedDB wrapper: everything stays in this browser profile.
const DB_NAME = 'paper-reader';
const DB_VERSION = 1;

export type Status = 'unread' | 'reading' | 'done';

export interface PaperMeta {
  key: string; // relative path inside the opened folder
  status: Status;
  star: boolean;
  page: number;
  scale: string;
  notes: string;
  notesUpdated: number;
  lastOpened: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('papers')) d.createObjectStore('papers', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const tx = d.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const kvGet = <T>(key: string) => run<T | undefined>('kv', 'readonly', (s) => s.get(key));
export const kvSet = (key: string, value: unknown) => run<void>('kv', 'readwrite', (s) => s.put(value, key));
export const kvDel = (key: string) => run<void>('kv', 'readwrite', (s) => s.delete(key));

export function blankMeta(key: string): PaperMeta {
  return { key, status: 'unread', star: false, page: 1, scale: 'page-width', notes: '', notesUpdated: 0, lastOpened: 0 };
}

export const allMeta = () => run<PaperMeta[]>('papers', 'readonly', (s) => s.getAll());
export const putMeta = (m: PaperMeta) => run<void>('papers', 'readwrite', (s) => s.put(m));
