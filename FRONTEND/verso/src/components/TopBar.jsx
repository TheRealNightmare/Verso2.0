import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopBar = () => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="top-bar">
      <div className="search-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search book, name, author..."
          className="search-input"
        />
      </div>

      <div className="top-bar-actions">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        {!user ? (
          <div className="auth-shortcuts">
            <Link to="/login" className="auth-shortcut-link">Log in</Link>
            <Link to="/register" className="auth-shortcut-link auth-shortcut-primary">Register</Link>
          </div>
        ) : (
          <div className="profile-section">
            <div
              className="profile-pic"
              style={{
                background: '#5b7c99',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                borderRadius: '50%',
                width: 36,
                height: 36,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span className="profile-name" style={{ cursor: 'pointer' }} onClick={logout}>
              {user.name} (logout)
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
