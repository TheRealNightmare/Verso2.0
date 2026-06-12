import { apiFetch } from './auth';

// Persistent room invitations — surface as clickable notifications in the bell.

export const listRoomInvitations = () => apiFetch('/room-invitations');

export const acceptRoomInvitation = (id) =>
  apiFetch(`/room-invitations/${id}/accept`, { method: 'POST' });

export const declineRoomInvitation = (id) =>
  apiFetch(`/room-invitations/${id}/decline`, { method: 'POST' });
