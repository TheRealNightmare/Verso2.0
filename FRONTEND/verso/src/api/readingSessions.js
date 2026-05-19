import { apiFetch } from './auth';

export function startSession({ bookId, userUploadId } = {}) {
  return apiFetch('/reading-sessions', {
    method: 'POST',
    body: JSON.stringify({
      book_id: bookId ?? null,
      user_upload_id: userUploadId ?? null,
    }),
  });
}

export function endSession(id) {
  return apiFetch(`/reading-sessions/${id}`, { method: 'PATCH' });
}
