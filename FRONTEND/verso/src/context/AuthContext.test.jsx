import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../api/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
}));
vi.mock('../api/profile', () => ({
  getProfile: vi.fn(),
}));
vi.mock('../lib/echo', () => ({
  disconnectEcho: vi.fn(),
}));

import { AuthProvider, useAuth } from './AuthContext';
import { loginUser, registerUser, logoutUser } from '../api/auth';
import { getProfile } from '../api/profile';
import { disconnectEcho } from '../lib/echo';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // By default make the startup profile refresh reject: the effect's .catch keeps
  // the cached user untouched, so login/register/logout/updateUser tests aren't
  // perturbed by an async server refresh. The dedicated startup test overrides this.
  getProfile.mockRejectedValue(new Error('no refresh in this test'));
});

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it('starts with no user or token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

describe('login / register', () => {
  it('login persists token + user and updates state', async () => {
    loginUser.mockResolvedValue({ token: 'abc', user: { id: 1, name: 'Ada' } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login({ email: 'a@b.c', password: 'pw' });
    });

    expect(result.current.token).toBe('abc');
    expect(result.current.user).toMatchObject({ id: 1, name: 'Ada' });
    expect(localStorage.getItem('auth_token')).toBe('abc');
    expect(JSON.parse(localStorage.getItem('auth_user'))).toMatchObject({ id: 1 });
  });

  it('register persists token + user and updates state', async () => {
    registerUser.mockResolvedValue({ token: 'xyz', user: { id: 2, name: 'Bob' } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.register({ name: 'Bob', email: 'b@b.c', password: 'pw' });
    });

    expect(result.current.token).toBe('xyz');
    expect(result.current.user).toMatchObject({ id: 2, name: 'Bob' });
    expect(localStorage.getItem('auth_token')).toBe('xyz');
  });
});

describe('updateUser', () => {
  it('merges a partial into the user and persists it', async () => {
    loginUser.mockResolvedValue({ token: 't', user: { id: 1, name: 'Ada', bio: 'x' } });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'a@b.c', password: 'pw' });
    });
    act(() => {
      result.current.updateUser({ bio: 'updated' });
    });

    expect(result.current.user).toMatchObject({ id: 1, name: 'Ada', bio: 'updated' });
    expect(JSON.parse(localStorage.getItem('auth_user')).bio).toBe('updated');
  });
});

describe('logout', () => {
  it('clears storage, disconnects echo, and resets state', async () => {
    loginUser.mockResolvedValue({ token: 't', user: { id: 1 } });
    logoutUser.mockResolvedValue({});
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'a@b.c', password: 'pw' });
    });
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(disconnectEcho).toHaveBeenCalled();
  });

  it('still logs out locally when the server logout call fails', async () => {
    loginUser.mockResolvedValue({ token: 't', user: { id: 1 } });
    logoutUser.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'a@b.c', password: 'pw' });
    });
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});

describe('startup profile refresh', () => {
  it('refreshes the cached user from the server when a token exists on mount', async () => {
    localStorage.setItem('auth_token', 'existing');
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Old' }));
    getProfile.mockResolvedValue({ name: 'Fresh', avatarUrl: '/a.png', role: 'user', bio: 'b' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user.name).toBe('Fresh'));
    expect(getProfile).toHaveBeenCalled();
  });
});
