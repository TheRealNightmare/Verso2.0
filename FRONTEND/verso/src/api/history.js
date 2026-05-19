import { apiFetch } from './auth';

export function fetchHistory() {
  return apiFetch('/history');
}

export function saveHistory({ bookId = null, uploadId = null, progress }) {
  const body = { progress };
  if (bookId != null) body.book_id = bookId;
  if (uploadId != null) body.user_upload_id = uploadId;
  return apiFetch('/history', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteHistory(id) {
  return apiFetch(`/history/${id}`, { method: 'DELETE' });
}
