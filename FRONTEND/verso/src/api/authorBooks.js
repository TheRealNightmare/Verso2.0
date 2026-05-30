import { apiFetch } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL;

export function publishBook(formData) {
  return apiFetch('/author/books', { method: 'POST', body: formData });
}

// XHR-based upload so we can stream progress events back to the UI.
export function publishBookWithProgress(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('auth_token');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/author/books`, true);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject({ status: xhr.status, ...data });
      }
    };
    xhr.onerror = () => reject({ status: 0, message: 'Network error' });
    xhr.send(formData);
  });
}

export function updateMyBook(id, formData) {
  // Laravel can handle PATCH via _method on multipart POST.
  formData.append('_method', 'PATCH');
  return apiFetch(`/author/books/${id}`, { method: 'POST', body: formData });
}

export function deleteMyBook(id) {
  return apiFetch(`/author/books/${id}`, { method: 'DELETE' });
}

export function getMyUploadedBooks() {
  return apiFetch('/me/books');
}

export function getBooksByAuthor(userId) {
  return apiFetch(`/users/${userId}/books`);
}
