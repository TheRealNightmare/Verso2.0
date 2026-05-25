import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, History, Bookmark, Grid, Calendar, Users, MessageSquare, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home', match: (p) => p === '/' },
  { to: '/history', icon: History, label: 'History', match: (p) => p === '/history' },
  { to: '/storage', icon: Bookmark, label: 'Storage', match: (p) => p === '/storage' },
  { to: '/dashboard', icon: Grid, label: 'Dashboard', match: (p) => p === '/dashboard' },
  { to: '/events', icon: Calendar, label: 'Events', match: (p) => p.startsWith('/events') || p === '/create-event' },
  { to: '/community', icon: Users, label: 'Community', match: (p) => p === '/community' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', match: (p) => p.startsWith('/messages'), badge: 'unread' },
];

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const location = useLocation();
  const { unreadTotal } = useNotifications();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-[#f8f6f2] border-r border-slate-200
          flex flex-col py-6 gap-4 shrink-0 transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:w-20 lg:translate-x-0 lg:items-center lg:gap-6 lg:transition-none
        `}
      >
        <div className="flex items-center justify-between px-5 lg:px-0 lg:justify-center">
          <BookOpen size={32} color="#2c3e50" fill="#2c3e50" strokeWidth={1.5} />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-[#5b7c99] lg:hidden"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mx-5 border-t border-slate-200 lg:mx-0 lg:w-8" />

        <nav className="flex flex-col gap-1 px-3 lg:items-center lg:gap-6 lg:px-0">
          {navItems.map(({ to, icon: Icon, label, match, badge }) => {
            const active = match(location.pathname);
            const showBadge = badge === 'unread' && unreadTotal > 0;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors lg:w-10 lg:h-10 lg:justify-center lg:gap-0 lg:px-0 lg:py-0 ${
                  active ? 'bg-[#5b7c99]/10 text-[#5b7c99]' : 'text-slate-500 hover:text-[#5b7c99] hover:bg-slate-100'
                }`}
              >
                <span className="relative">
                  <Icon size={22} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium lg:hidden">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
