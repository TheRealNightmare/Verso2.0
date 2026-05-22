import { apiFetch } from './auth';

export const fetchGenders = () => apiFetch('/meta/genders');
export const fetchEventCategories = () => apiFetch('/meta/event-categories');
