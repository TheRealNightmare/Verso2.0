const DB_NAME = 'verso_uploads';
const STORE = 'files';
const VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export async function putFile(hash, blob) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(blob, hash);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getFile(hash) {
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(hash);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFile(hash) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(hash);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function sha256Hex(arrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
