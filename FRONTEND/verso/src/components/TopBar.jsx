import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

const TopBar = () => {
  return (
    <header className="top-bar">
      {/* 1. Search Section */}
      <div className="search-wrapper">
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          placeholder="Search book, name, author..." 
          className="search-input"
        />
      </div>

      {/* 2. Actions Section (Bell + Profile) */}
      <div className="top-bar-actions">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="auth-shortcuts">
          <Link to="/login" className="auth-shortcut-link">Log in</Link>
          <Link to="/register" className="auth-shortcut-link auth-shortcut-primary">Register</Link>
        </div>
        
        <div className="profile-section">
          <img 
            src="https://i.pravatar.cc/150?u=peter" 
            alt="Profile" 
            className="profile-pic" 
          />
          <span className="profile-name">Peter Parker</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;