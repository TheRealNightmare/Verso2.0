import { apiFetch } from './auth';

export function listTodos() {
  return apiFetch('/todos');
}

export function createTodo(payload) {
  return apiFetch('/todos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTodo(id, payload) {
  return apiFetch(`/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTodo(id) {
  return apiFetch(`/todos/${id}`, { method: 'DELETE' });
}
