import { getSocketId } from '../lib/echo';

const BASE_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const socketId = getSocketId();

  const headers = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(socketId ? { 'X-Socket-ID': socketId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data;
}

export async function registerUser({ name, email, password, role, avatar, bio }) {
  const form = new FormData();
  form.append('name', name);
  form.append('email', email);
  form.append('password', password);
  form.append('role', role || 'user');
  if (avatar) form.append('avatar', avatar);
  if (bio) form.append('bio', bio);
  return apiFetch('/register', { method: 'POST', body: form });
}

export async function loginUser({ email, password }) {
  return apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser() {
  return apiFetch('/logout', { method: 'POST' });
}
