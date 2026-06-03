import { apiFetch } from './auth';

// Completed books that are eligible for an AI quiz (with the user's best score, if any).
export function fetchAvailableQuizzes() {
  return apiFetch('/quizzes/available');
}

// Build (or reuse) the quiz for a completed book; returns questions without answers.
export function generateQuiz(bookId) {
  return apiFetch('/quizzes/generate', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId }),
  });
}

// Submit answers (array of 0-based option indices) and get the graded result.
export function submitQuiz(quizId, answers) {
  return apiFetch(`/quizzes/${quizId}/attempt`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}
