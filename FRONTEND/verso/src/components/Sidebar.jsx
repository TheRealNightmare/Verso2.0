import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, History, Download, Grid, Calendar, Users } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <BookOpen 
          size={32}           /* Smaller size for sidebar compared to login page */
          color="#2c3e50"     /* Matches the navy blue in Screenshot 2026-05-01 201803.png */
          fill="#2c3e50"      /* Fills the icon as seen in your reference image */
          strokeWidth={1.5}   /* Creates the white 'page' gaps */
        />
      </div>
      
      <nav className="nav-icons">
        {/* HOME */}
        <Link to="/">
          <Home className={`icon ${location.pathname === '/' ? 'active' : ''}`} size={24} />
        </Link>

        {/* HISTORY */}
        <Link to="/history">
          <History className={`icon ${location.pathname === '/history' ? 'active' : ''}`} size={24} />
        </Link>

        {/* STORAGE (Make sure there is ONLY ONE of these) */}
        <Link to="/storage">
          <Download 
            className={`icon ${location.pathname === '/storage' ? 'active' : ''}`} 
            size={24} 
          />
        </Link>

        {/* OTHER ICONS (Keep them without Links if they don't have pages yet) */}
        <Grid className="icon" size={24} />
        <Calendar className="icon" size={24} />
        <Users className="icon" size={24} />
      </nav>
    </aside>
  );
};

export default Sidebar;
