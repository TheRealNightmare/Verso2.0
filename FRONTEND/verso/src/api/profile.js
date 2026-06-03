import { apiFetch } from './auth';
import { cachedFetch, invalidate, invalidatePrefix, writeCache } from '../lib/cache';

export const PROFILE_ME_KEY = 'profile:me';
const PROFILE_TTL = 2 * 60 * 1000; // 2 minutes

// Cached + de-duplicated: AuthContext, Profile.jsx and any other consumer that
// calls getProfile() on the same load share a single network request.
export function getProfile() {
  return cachedFetch(PROFILE_ME_KEY, () => apiFetch('/profile'), { ttl: PROFILE_TTL });
}

export function updateProfile(payload) {
  return apiFetch('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((data) => {
    // Drop cached views of any user profile, then seed our own from the server's
    // response so the next getProfile() is instant and reflects the edit.
    invalidatePrefix('profile:');
    writeCache(PROFILE_ME_KEY, data);
    return data;
  });
}

export function updateProfilePhoto(file) {
  const fd = new FormData();
  fd.append('photo', file);
  return apiFetch('/profile/photo', { method: 'POST', body: fd }).then((data) => {
    invalidate(PROFILE_ME_KEY);
    invalidatePrefix('profile:');
    return data;
  });
}
