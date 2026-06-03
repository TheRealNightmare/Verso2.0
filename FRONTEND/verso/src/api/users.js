import { apiFetch } from './auth';
import { cachedFetch } from '../lib/cache';

const PROFILE_TTL = 2 * 60 * 1000; // 2 minutes
const SEARCH_TTL = 60 * 1000; // 1 minute

// Cached so re-typing a recent search term is instant (keep the debounce upstream).
export function searchUsers(q) {
  const term = q.trim().toLowerCase();
  return cachedFetch(
    `search:users:${term}`,
    () => apiFetch(`/users/search?q=${encodeURIComponent(q)}`),
    { ttl: SEARCH_TTL }
  );
}

// Shared key with the rest of the app: visiting the same profile twice, or
// AuthContext + UserProfile hitting it together, share one request.
export function getUserProfile(id) {
  return cachedFetch(`profile:${id}`, () => apiFetch(`/users/${id}`), { ttl: PROFILE_TTL });
}

export function getUserFavorites(id) {
  return apiFetch(`/users/${id}/favorites`);
}
