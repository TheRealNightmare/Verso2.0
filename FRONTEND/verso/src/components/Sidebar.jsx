import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, History, Bookmark, Grid, Calendar, Users, MessageSquare } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';

const navItems = [
  { to: '/', icon: Home, match: (p) => p === '/' },
  { to: '/history', icon: History, match: (p) => p === '/history' },
  { to: '/storage', icon: Bookmark, match: (p) => p === '/storage' },
  { to: '/dashboard', icon: Grid, match: (p) => p === '/dashboard' },
  { to: '/events', icon: Calendar, match: (p) => p.startsWith('/events') || p === '/create-event' },
  { to: '/community', icon: Users, match: (p) => p === '/community' },
  { to: '/messages', icon: MessageSquare, match: (p) => p.startsWith('/messages'), badge: 'unread' },
];

const Sidebar = () => {
  const location = useLocation();
  const { unreadTotal } = useNotifications();

  return (
    <aside className="w-20 bg-[#f8f6f2] border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0">
      <div className="flex items-center justify-center">
        <BookOpen size={32} color="#2c3e50" fill="#2c3e50" strokeWidth={1.5} />
      </div>

      <div className="w-8 border-t border-slate-200" />

      <nav className="flex flex-col items-center gap-6">
        {navItems.map(({ to, icon: Icon, match, badge }) => {
          const active = match(location.pathname);
          const showBadge = badge === 'unread' && unreadTotal > 0;
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                active ? 'bg-[#5b7c99]/10 text-[#5b7c99]' : 'text-slate-500 hover:text-[#5b7c99] hover:bg-slate-100'
              }`}
            >
              <Icon size={22} />
              {showBadge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
