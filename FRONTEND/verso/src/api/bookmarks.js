import { apiFetch } from './auth';

export function fetchBookmarks() {
  return apiFetch('/bookmarks');
}

export function addBookmark(bookId) {
  return apiFetch('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId }),
  });
}

export function removeBookmark(bookId) {
  return apiFetch(`/bookmarks/${bookId}`, { method: 'DELETE' });
}
