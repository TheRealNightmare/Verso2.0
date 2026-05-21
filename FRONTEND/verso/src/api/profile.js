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

export function updateProfilePhoto(file) {
  const fd = new FormData();
  fd.append('photo', file);
  return apiFetch('/profile/photo', { method: 'POST', body: fd });
}
