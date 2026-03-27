import { Link, useLocation } from 'react-router-dom';
import { Home, History, Download, Grid, Calendar, Users } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="logo-section">📖</div>
      
      <nav className="nav-icons">
        <Link to="/">
          <Home className={`icon ${location.pathname === '/' ? 'active' : ''}`} size={24} />
        </Link>

        <Link to="/history">
          <History className={`icon ${location.pathname === '/history' ? 'active' : ''}`} size={24} />
        </Link>

        <Download className="icon" size={24} />
        <Grid className="icon" size={24} />
        <Calendar className="icon" size={24} />
        <Users className="icon" size={24} />
      </nav>
    </aside>
  );
};

export default Sidebar;