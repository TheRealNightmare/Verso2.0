import { apiFetch } from './auth';

export function fetchFavorites() {
  return apiFetch('/favorites');
}

export function toggleFavorite(bookId) {
  return apiFetch('/favorites/toggle', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId }),
  });
}
