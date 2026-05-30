import { apiFetch } from './auth';

export function fetchHistory() {
  return apiFetch('/history');
}

export async function fetchHistoryEntry({ bookId = null, uploadId = null } = {}) {
  const list = await fetchHistory();
  if (!Array.isArray(list)) return null;
  return list.find((entry) => {
    if (bookId != null) return Number(entry.book_id) === Number(bookId);
    if (uploadId != null) return Number(entry.user_upload_id) === Number(uploadId);
    return false;
  }) || null;
}

export function saveHistory({ bookId = null, uploadId = null, progress, currentPage = null }) {
  const body = { progress };
  if (bookId != null) body.book_id = bookId;
  if (uploadId != null) body.user_upload_id = uploadId;
  if (currentPage != null) body.current_page = currentPage;
  return apiFetch('/history', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteHistory(id) {
  return apiFetch(`/history/${id}`, { method: 'DELETE' });
}
