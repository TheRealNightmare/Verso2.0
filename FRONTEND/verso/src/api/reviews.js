import { apiFetch } from './auth';

export function fetchReviews(bookId) {
  return apiFetch(`/books/${bookId}/reviews`);
}

export function postReview(bookId, { rating, comment }) {
  return apiFetch(`/books/${bookId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
}
