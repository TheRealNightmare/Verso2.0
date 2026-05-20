import { apiFetch } from './auth';

export async function getCommunityInfo() {
  return apiFetch('/community/info');
}

export async function listMessages({ before, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (before) params.set('before', String(before));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return apiFetch(`/community/messages${qs ? `?${qs}` : ''}`);
}

export async function sendTextMessage(body) {
  return apiFetch('/community/messages', {
    method: 'POST',
    body: JSON.stringify({ type: 'text', body }),
  });
}

export async function sendAudioMessage(file, durationSec) {
  const form = new FormData();
  form.append('type', 'audio');
  form.append('audio', file);
  form.append('duration_sec', String(durationSec));
  return apiFetch('/community/messages', { method: 'POST', body: form });
}

export async function sendImageMessage(file, caption = '') {
  const form = new FormData();
  form.append('type', 'image');
  form.append('image', file);
  if (caption) form.append('body', caption);
  return apiFetch('/community/messages', { method: 'POST', body: form });
}

export async function editMessage(id, body) {
  return apiFetch(`/community/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
}

export async function deleteMessage(id) {
  return apiFetch(`/community/messages/${id}`, { method: 'DELETE' });
}

export async function toggleReaction(id, emoji) {
  return apiFetch(`/community/messages/${id}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

export async function pingPresence() {
  return apiFetch('/presence/ping', { method: 'POST' });
}
