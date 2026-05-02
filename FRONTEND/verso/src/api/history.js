import { apiFetch } from './auth';

export function fetchHistory() {
  return apiFetch('/history');
}

export function saveHistory(bookId, progress) {
  return apiFetch('/history', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId, progress }),
  });
}

export function deleteHistory(id) {
  return apiFetch(`/history/${id}`, { method: 'DELETE' });
}
