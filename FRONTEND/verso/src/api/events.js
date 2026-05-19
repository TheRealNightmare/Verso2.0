import { apiFetch } from './auth';

export function fetchEvents(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/events${qs ? `?${qs}` : ''}`);
}

export function fetchEvent(id) {
  return apiFetch(`/events/${id}`);
}

export function createEvent(formData) {
  return apiFetch('/events', { method: 'POST', body: formData });
}

export function updateEvent(id, formData) {
  if (!formData.has('_method')) formData.append('_method', 'PUT');
  return apiFetch(`/events/${id}`, { method: 'POST', body: formData });
}

export function deleteEvent(id) {
  return apiFetch(`/events/${id}`, { method: 'DELETE' });
}
