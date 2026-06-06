import { apiFetch } from './auth';

// Ask Gemini a custom question about a highlighted passage. The answer is
// returned live and not persisted.
export const askGemini = ({ selectedText, question, bookTitle }) =>
  apiFetch('/reader/ask-gemini', {
    method: 'POST',
    body: JSON.stringify({
      selected_text: selectedText,
      question,
      book_title: bookTitle ?? null,
    }),
  });
