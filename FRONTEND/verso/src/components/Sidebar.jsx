import React from 'react';
// Note: You can install lucide-react with: npm install lucide-react
import { Home, History, Users, Grid, Calendar, Heart, MoreHorizontal } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">📖</div>
        <nav className="nav-menu">
          <Home className="nav-item active" size={22} />
          <History className="nav-item" size={22} />
          <Users className="nav-item" size={22} />
          <Grid className="nav-item" size={22} />
          <Calendar className="nav-item" size={22} />
          <Heart className="nav-item" size={22} />
        </nav>
      </div>
      
      <div className="sidebar-bottom">
        <MoreHorizontal className="nav-item" size={22} />
        <Users className="nav-item" size={22} /> {/* Settings/Profile icon */}
      </div>
    </aside>
  );
};

export default Sidebar;