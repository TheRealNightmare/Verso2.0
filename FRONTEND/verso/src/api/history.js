import { apiFetch } from './auth';
import { cachedFetch, invalidate } from '../lib/cache';

const HISTORY_KEY = 'history:me';
const HISTORY_TTL = 60 * 1000; // 1 minute

export function fetchHistory() {
  return cachedFetch(HISTORY_KEY, () => apiFetch('/history'), { ttl: HISTORY_TTL });
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
  }).then((data) => {
    invalidate(HISTORY_KEY);
    return data;
  });
}

export function deleteHistory(id) {
  return apiFetch(`/history/${id}`, { method: 'DELETE' }).then((data) => {
    invalidate(HISTORY_KEY);
    return data;
  });
}
