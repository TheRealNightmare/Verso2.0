import { apiFetch } from './auth';

export function fetchHomeBooks() {
  return apiFetch('/books/home');
}

export function fetchBooks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/books${query ? `?${query}` : ''}`);
}

export function fetchBook(id) {
  return apiFetch(`/books/${id}`);
}
