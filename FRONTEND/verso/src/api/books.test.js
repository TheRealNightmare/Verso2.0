import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the network boundary; cache.js runs for real so we also exercise the
// cache integration (cold key -> fetcher called, refreshBook -> invalidate + refetch).
vi.mock('./auth', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from './auth';
import { fetchHomeBooks, fetchBooks, fetchBook, refreshBook, bookKey } from './books';

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockResolvedValue({ ok: true });
});

describe('books api', () => {
  it('fetchHomeBooks hits /books/home', async () => {
    await fetchHomeBooks();
    expect(apiFetch).toHaveBeenCalledWith('/books/home');
  });

  it('fetchBooks builds a query string and caches by it', async () => {
    await fetchBooks({ q: 'dune', page: 2 });
    expect(apiFetch).toHaveBeenCalledWith('/books?q=dune&page=2');
  });

  it('fetchBooks omits the query when params are empty', async () => {
    await fetchBooks();
    expect(apiFetch).toHaveBeenCalledWith('/books');
  });

  it('fetchBook hits /books/:id', async () => {
    await fetchBook('unique-101');
    expect(apiFetch).toHaveBeenCalledWith('/books/unique-101');
  });

  it('bookKey namespaces the cache key', () => {
    expect(bookKey(7)).toBe('book:7');
  });

  it('refreshBook invalidates the cache then refetches', async () => {
    await fetchBook('refresh-1'); // warm the cache
    apiFetch.mockClear();

    await refreshBook('refresh-1');
    // Because the cached entry was invalidated, the network is hit again.
    expect(apiFetch).toHaveBeenCalledWith('/books/refresh-1');
  });
});
