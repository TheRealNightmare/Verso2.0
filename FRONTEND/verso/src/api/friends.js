import { apiFetch } from './auth';

export function listFriends() {
  return apiFetch('/friends');
}

export function listFriendRequests() {
  return apiFetch('/friends/requests');
}

export function sendFriendRequest(userId) {
  return apiFetch('/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

export function acceptFriendRequest(requestId) {
  return apiFetch(`/friends/requests/${requestId}/accept`, { method: 'POST' });
}

export function declineFriendRequest(requestId) {
  return apiFetch(`/friends/requests/${requestId}/decline`, { method: 'POST' });
}

export function removeFriend(userId) {
  return apiFetch(`/friends/${userId}`, { method: 'DELETE' });
}
