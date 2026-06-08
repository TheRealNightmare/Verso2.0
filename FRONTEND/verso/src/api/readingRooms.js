import { apiFetch } from './auth';

// --- Rooms -----------------------------------------------------------------

export const listRooms = ({ scope = 'mine', type } = {}) => {
  const params = new URLSearchParams({ scope });
  if (type) params.set('type', type);
  return apiFetch(`/reading-rooms?${params.toString()}`);
};

export const getRoom = (roomId) => apiFetch(`/reading-rooms/${roomId}`);

export const createRoom = (payload) =>
  apiFetch('/reading-rooms', { method: 'POST', body: JSON.stringify(payload) });

export const updateRoom = (roomId, payload) =>
  apiFetch(`/reading-rooms/${roomId}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteRoom = (roomId) =>
  apiFetch(`/reading-rooms/${roomId}`, { method: 'DELETE' });

export const joinRoom = (roomId) =>
  apiFetch(`/reading-rooms/${roomId}/join`, { method: 'POST' });

export const joinByCode = (code) =>
  apiFetch('/reading-rooms/join', { method: 'POST', body: JSON.stringify({ code }) });

export const leaveRoom = (roomId) =>
  apiFetch(`/reading-rooms/${roomId}/leave`, { method: 'POST' });

export const inviteFriend = (roomId, userId) =>
  apiFetch(`/reading-rooms/${roomId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });

export const kickMember = (roomId, userId) =>
  apiFetch(`/reading-rooms/${roomId}/members/${userId}`, { method: 'DELETE' });

export const updateProgress = (roomId, page) =>
  apiFetch(`/reading-rooms/${roomId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ page }),
  });

// --- Shared highlights -----------------------------------------------------

export const listRoomHighlights = (roomId) =>
  apiFetch(`/reading-rooms/${roomId}/highlights`);

export const createRoomHighlight = (roomId, payload) =>
  apiFetch(`/reading-rooms/${roomId}/highlights`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateRoomHighlight = (id, payload) =>
  apiFetch(`/room-highlights/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteRoomHighlight = (id) =>
  apiFetch(`/room-highlights/${id}`, { method: 'DELETE' });

// --- Highlight comments ----------------------------------------------------

export const listHighlightComments = (highlightId) =>
  apiFetch(`/room-highlights/${highlightId}/comments`);

export const addHighlightComment = (highlightId, body) =>
  apiFetch(`/room-highlights/${highlightId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

export const deleteComment = (id) =>
  apiFetch(`/room-comments/${id}`, { method: 'DELETE' });

// --- Room chat (same shapes as community.js so chat components drop in) -----

export const listRoomMessages = (roomId, { before, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (before) params.set('before', String(before));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return apiFetch(`/reading-rooms/${roomId}/messages${qs ? `?${qs}` : ''}`);
};

export const sendRoomText = (roomId, body, isSpoiler = false) =>
  apiFetch(`/reading-rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ type: 'text', body, is_spoiler: isSpoiler }),
  });

export const sendRoomAudio = (roomId, file, durationSec) => {
  const form = new FormData();
  form.append('type', 'audio');
  form.append('audio', file);
  form.append('duration_sec', String(durationSec));
  return apiFetch(`/reading-rooms/${roomId}/messages`, { method: 'POST', body: form });
};

export const sendRoomImage = (roomId, file, caption = '', isSpoiler = false) => {
  const form = new FormData();
  form.append('type', 'image');
  form.append('image', file);
  if (caption) form.append('body', caption);
  if (isSpoiler) form.append('is_spoiler', '1');
  return apiFetch(`/reading-rooms/${roomId}/messages`, { method: 'POST', body: form });
};

export const editRoomMessage = (roomId, id, body) =>
  apiFetch(`/reading-rooms/${roomId}/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });

export const deleteRoomMessage = (roomId, id) =>
  apiFetch(`/reading-rooms/${roomId}/messages/${id}`, { method: 'DELETE' });

export const toggleRoomReaction = (roomId, id, emoji) =>
  apiFetch(`/reading-rooms/${roomId}/messages/${id}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
