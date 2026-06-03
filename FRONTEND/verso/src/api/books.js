import { apiFetch } from './auth';
import { cachedFetch, invalidate } from '../lib/cache';

const LIST_TTL = 60 * 1000; // 1 minute
const BOOK_TTL = 2 * 60 * 1000; // 2 minutes

export const bookKey = (id) => `book:${id}`;

export function fetchHomeBooks() {
  return apiFetch('/books/home');
}

// Cached by query string so repeated searches / browses reuse recent results.
export function fetchBooks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return cachedFetch(
    `books:list:${query}`,
    () => apiFetch(`/books${query ? `?${query}` : ''}`),
    { ttl: LIST_TTL }
  );
}

export function fetchBook(id) {
  return cachedFetch(bookKey(id), () => apiFetch(`/books/${id}`), { ttl: BOOK_TTL });
}

// Force-refresh a single book (e.g. after posting a review) and update the cache.
export function refreshBook(id) {
  invalidate(bookKey(id));
  return fetchBook(id);
}
