import { apiFetch } from './auth';

export const fetchAnnotations = (bookId) => apiFetch(`/books/${bookId}/annotations`);

export const createAnnotation = (bookId, payload) =>
  apiFetch(`/books/${bookId}/annotations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateAnnotation = (id, payload) =>
  apiFetch(`/annotations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteAnnotation = (id) =>
  apiFetch(`/annotations/${id}`, { method: 'DELETE' });

export const fetchUploadAnnotations = (uploadId) =>
  apiFetch(`/uploads/${uploadId}/annotations`);

export const createUploadAnnotation = (uploadId, payload) =>
  apiFetch(`/uploads/${uploadId}/annotations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
