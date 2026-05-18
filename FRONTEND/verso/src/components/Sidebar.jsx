import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, History, Download, Grid, Calendar, Users } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, match: (p) => p === '/' },
  { to: '/history', icon: History, match: (p) => p === '/history' },
  { to: '/storage', icon: Download, match: (p) => p === '/storage' },
  { to: '/dashboard', icon: Grid, match: (p) => p === '/dashboard' },
  { to: '/events', icon: Calendar, match: (p) => p.startsWith('/events') || p === '/create-event' },
  { to: '/community', icon: Users, match: (p) => p === '/community' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-8 shrink-0">
      <div className="flex items-center justify-center">
        <BookOpen size={32} color="#2c3e50" fill="#2c3e50" strokeWidth={1.5} />
      </div>

      <nav className="flex flex-col items-center gap-6">
        {navItems.map(({ to, icon: Icon, match }) => {
          const active = match(location.pathname);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                active ? 'bg-[#5b7c99]/10 text-[#5b7c99]' : 'text-slate-500 hover:text-[#5b7c99] hover:bg-slate-100'
              }`}
            >
              <Icon size={22} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
