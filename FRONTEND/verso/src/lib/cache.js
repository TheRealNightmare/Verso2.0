// Tiny stale-while-revalidate cache for API responses.
//
// Two layers: an in-memory Map (fast, survives a render but not a reload) backed
// by localStorage (persists across reloads). Reads hit memory first and only fall
// back to localStorage + JSON.parse on a cold start.
//
// Stored shape: { data, ts } where ts is Date.now() at write time.

export const HOME_TTL = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_TTL = 5 * 60 * 1000;

const PREFIX = 'verso:'; // namespaces our keys in localStorage
const mem = new Map(); // key -> { data, ts }
const inFlight = new Map(); // key -> Promise (request de-duplication)

function storageKey(key) {
  return `${PREFIX}${key}`;
}

// Read a raw cache entry ({ data, ts }) or null. Checks memory, then localStorage.
export function readCache(key) {
  if (mem.has(key)) return mem.get(key);
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    mem.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

// Write data under a key to both layers. Returns the stored entry.
export function writeCache(key, data) {
  const entry = { data, ts: Date.now() };
  mem.set(key, entry);
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // Quota errors / disabled storage are non-fatal — keep the in-memory copy.
  }
  return entry;
}

// True when an entry exists and is younger than ttl.
export function isFresh(entry, ttl = DEFAULT_TTL) {
  return !!entry && typeof entry.ts === 'number' && Date.now() - entry.ts < ttl;
}

// Drop a single key from both layers (and any in-flight request).
export function invalidate(key) {
  mem.delete(key);
  inFlight.delete(key);
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    /* non-fatal */
  }
}

// Drop every key starting with `prefix` (e.g. 'profile:' or 'dashboard:').
export function invalidatePrefix(prefix) {
  for (const key of [...mem.keys()]) {
    if (key.startsWith(prefix)) invalidate(key);
  }
  try {
    const full = storageKey(prefix);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(full)) localStorage.removeItem(k);
    }
  } catch {
    /* non-fatal */
  }
}

// Fetch-through cache with stale-while-revalidate and in-flight de-duplication.
//
//   cachedFetch(key, fetcher, { ttl, swr })
//
// - Returns a Promise resolving to the data.
// - On a fresh hit, resolves immediately from cache with no network call.
// - On a stale hit with swr=true (default), resolves from cache immediately and
//   refreshes in the background. With swr=false, awaits the network refresh.
// - Concurrent callers for the same key share one in-flight request.
export function cachedFetch(key, fetcher, { ttl = DEFAULT_TTL, swr = true } = {}) {
  const entry = readCache(key);

  const revalidate = () => {
    if (inFlight.has(key)) return inFlight.get(key);
    const p = Promise.resolve()
      .then(fetcher)
      .then((data) => {
        writeCache(key, data);
        return data;
      })
      .finally(() => {
        inFlight.delete(key);
      });
    inFlight.set(key, p);
    return p;
  };

  if (isFresh(entry, ttl)) {
    return Promise.resolve(entry.data);
  }

  if (entry && swr) {
    // Serve stale data now; refresh in the background (swallow background errors).
    revalidate().catch(() => {});
    return Promise.resolve(entry.data);
  }

  return revalidate();
}
