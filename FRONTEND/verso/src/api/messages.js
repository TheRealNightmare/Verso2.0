import { apiFetch } from './auth';

export function getInbox() {
  return apiFetch('/messages');
}

export function getThread(userId) {
  return apiFetch(`/messages/${userId}`);
}

export function sendDirectMessage(userId, body) {
  return apiFetch(`/messages/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function markThreadRead(userId) {
  return apiFetch(`/messages/${userId}/read`, { method: 'POST' });
}
