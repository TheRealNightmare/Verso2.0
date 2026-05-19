import { apiFetch } from './auth';

export function getProfile() {
  return apiFetch('/profile');
}

export function updateProfile(payload) {
  return apiFetch('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
