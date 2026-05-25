import { apiFetch } from './auth';

export function searchUsers(q) {
  return apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
}

export function getUserProfile(id) {
  return apiFetch(`/users/${id}`);
}
