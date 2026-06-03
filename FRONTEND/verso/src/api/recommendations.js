import { apiFetch } from './auth';

export function fetchRecommendedBooks() {
  return apiFetch('/recommendations/books');
}

export function fetchRecommendedPeople() {
  return apiFetch('/recommendations/people');
}
