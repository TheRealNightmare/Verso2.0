import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  readCache,
  writeCache,
  isFresh,
  invalidate,
  invalidatePrefix,
  cachedFetch,
} from './cache';

// localStorage is cleared by the global afterEach in src/test/setup.js, but the
// module-level in-memory Map persists across tests in the same file, so each test
// uses unique keys (or invalidates) to stay isolated.

describe('readCache / writeCache', () => {
  it('writes to memory and localStorage, then reads back', () => {
    const entry = writeCache('k1', { hello: 'world' });
    expect(entry.data).toEqual({ hello: 'world' });
    expect(typeof entry.ts).toBe('number');

    // localStorage got a namespaced copy.
    expect(localStorage.getItem('verso:k1')).toContain('hello');

    // Read returns the same data.
    expect(readCache('k1').data).toEqual({ hello: 'world' });
  });

  it('returns null for a missing key', () => {
    expect(readCache('does-not-exist')).toBeNull();
  });

  it('cold-reads from localStorage when memory is empty', () => {
    // Seed localStorage directly, simulating a fresh page load (empty mem Map).
    localStorage.setItem('verso:cold', JSON.stringify({ data: 42, ts: Date.now() }));
    expect(readCache('cold').data).toBe(42);
  });

  it('returns null for corrupt JSON in localStorage', () => {
    localStorage.setItem('verso:bad', '{not json');
    expect(readCache('bad')).toBeNull();
  });
});

describe('isFresh', () => {
  it('is false for null/undefined entries', () => {
    expect(isFresh(null)).toBe(false);
    expect(isFresh(undefined)).toBe(false);
  });

  it('respects the ttl boundary', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const entry = { data: 1, ts: Date.now() };
      expect(isFresh(entry, 1000)).toBe(true);

      vi.advanceTimersByTime(999);
      expect(isFresh(entry, 1000)).toBe(true);

      vi.advanceTimersByTime(2); // now 1001ms old > ttl
      expect(isFresh(entry, 1000)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('invalidate / invalidatePrefix', () => {
  it('invalidate removes a single key from both layers', () => {
    writeCache('solo', 1);
    expect(readCache('solo')).not.toBeNull();
    invalidate('solo');
    expect(readCache('solo')).toBeNull();
    expect(localStorage.getItem('verso:solo')).toBeNull();
  });

  it('invalidatePrefix drops every key under the prefix', () => {
    writeCache('profile:me', 1);
    writeCache('profile:42', 2);
    writeCache('book:1', 3);

    invalidatePrefix('profile:');

    expect(readCache('profile:me')).toBeNull();
    expect(readCache('profile:42')).toBeNull();
    // Unrelated prefix is untouched.
    expect(readCache('book:1')).not.toBeNull();
    invalidate('book:1');
  });
});

describe('cachedFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('serves a fresh entry without calling the fetcher', async () => {
    writeCache('cf:fresh', 'cached');
    const fetcher = vi.fn();
    const result = await cachedFetch('cf:fresh', fetcher, { ttl: 10_000 });
    expect(result).toBe('cached');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('calls the fetcher and caches when there is no entry', async () => {
    const fetcher = vi.fn().mockResolvedValue('network');
    const result = await cachedFetch('cf:cold', fetcher);
    expect(result).toBe('network');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(readCache('cf:cold').data).toBe('network');
  });

  it('serves stale data immediately and revalidates in the background (swr default)', async () => {
    writeCache('cf:stale', 'old');
    vi.advanceTimersByTime(10 * 60 * 1000); // past the 5-min default TTL

    const fetcher = vi.fn().mockResolvedValue('new');
    const result = await cachedFetch('cf:stale', fetcher);
    // Stale value returned right away.
    expect(result).toBe('old');

    // Background refresh runs and updates the cache.
    await vi.waitFor(() => expect(readCache('cf:stale').data).toBe('new'));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('awaits the network when swr is false on a stale entry', async () => {
    writeCache('cf:noswr', 'old');
    vi.advanceTimersByTime(10 * 60 * 1000);

    const fetcher = vi.fn().mockResolvedValue('new');
    const result = await cachedFetch('cf:noswr', fetcher, { swr: false });
    expect(result).toBe('new');
  });

  it('de-duplicates concurrent in-flight requests for the same key', async () => {
    // Two concurrent callers for the same cold key must share one fetcher call.
    const fetcher = vi.fn(() => Promise.resolve('value'));

    const [r1, r2] = await Promise.all([
      cachedFetch('cf:dedup', fetcher),
      cachedFetch('cf:dedup', fetcher),
    ]);

    expect(r1).toBe('value');
    expect(r2).toBe('value');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
