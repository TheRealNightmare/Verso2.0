import { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, logoutUser } from '../api/auth';
import { getProfile } from '../api/profile';
import { disconnectEcho } from '../lib/echo';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(credentials) {
    const data = await loginUser(credentials);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(credentials) {
    const data = await registerUser(credentials);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function updateUser(partial) {
    setUser((prev) => {
      const next = { ...(prev || {}), ...partial };
      localStorage.setItem('auth_user', JSON.stringify(next));
      return next;
    });
  }

  // Refresh the cached user from the server on startup so the TopBar (and any other
  // useAuth consumer) reflects the current name/avatar even if the localStorage
  // copy was saved by an older login. Errors are ignored to keep the cached user.
  useEffect(() => {
    if (!token) return;
    let active = true;
    getProfile()
      .then((data) => {
        if (!active) return;
        updateUser({ name: data.name, avatarUrl: data.avatarUrl });
      })
      .catch(() => {
        /* ignore; keep cached user */
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function logout() {
    try {
      await logoutUser();
    } catch (_) {
      // proceed with local logout even if server call fails
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    disconnectEcho();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
