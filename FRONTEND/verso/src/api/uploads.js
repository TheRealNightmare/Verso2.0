import { apiFetch } from './auth';

export function fetchUploads() {
  return apiFetch('/uploads');
}

export function registerUpload({ title, author, format, file_hash, file_size }) {
  return apiFetch('/uploads', {
    method: 'POST',
    body: JSON.stringify({ title, author, format, file_hash, file_size }),
  });
}

export function removeUpload(id) {
  return apiFetch(`/uploads/${id}`, { method: 'DELETE' });
}
