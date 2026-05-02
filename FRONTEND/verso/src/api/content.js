import { apiFetch } from './auth';

export function fetchBookContent(id) {
  return apiFetch(`/books/${id}/content`);
}
