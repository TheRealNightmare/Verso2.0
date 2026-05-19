import { apiFetch } from './auth';

export async function getCommunityInfo() {
  return apiFetch('/community/info');
}

export async function listMessages({ before, limit = 50, parentId } = {}) {
  const params = new URLSearchParams();
  if (before) params.set('before', String(before));
  if (limit) params.set('limit', String(limit));
  if (parentId) params.set('parent_id', String(parentId));
  const qs = params.toString();
  return apiFetch(`/community/messages${qs ? `?${qs}` : ''}`);
}

export async function listThreads(limit = 20) {
  return apiFetch(`/community/threads?limit=${limit}`);
}

export async function sendTextMessage(body, parentId = null) {
  return apiFetch('/community/messages', {
    method: 'POST',
    body: JSON.stringify({ type: 'text', body, parent_id: parentId || undefined }),
  });
}

export async function sendAudioMessage(file, durationSec, parentId = null) {
  const form = new FormData();
  form.append('type', 'audio');
  form.append('audio', file);
  form.append('duration_sec', String(durationSec));
  if (parentId) form.append('parent_id', String(parentId));
  return apiFetch('/community/messages', { method: 'POST', body: form });
}

export async function sendImageMessage(file, caption = '', parentId = null) {
  const form = new FormData();
  form.append('type', 'image');
  form.append('image', file);
  if (caption) form.append('body', caption);
  if (parentId) form.append('parent_id', String(parentId));
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
