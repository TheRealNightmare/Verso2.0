import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';

const TopBar = () => {
  const { user, logout } = useAuth();
  const confirm = useConfirm();

  const avatarUrl = user?.avatarUrl || 'https://i.pravatar.cc/64?img=12';

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: 'You will need to sign in again to access your library.',
      confirmLabel: 'Log out',
    });
    if (ok) logout();
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-[#f8f6f2] border-b border-slate-200">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          aria-label="Search books, names, authors"
          placeholder="Search book, name, author..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30"
        />
      </div>

      <div className="flex items-center gap-4">
        <button aria-label="Notifications" className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {!user ? (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm text-slate-600 hover:text-[#5b7c99]">
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm px-3 py-1.5 rounded-lg bg-[#5b7c99] text-white hover:bg-[#4a6a85]"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-3 group">
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow shrink-0"
              />
              <span className="text-sm text-slate-700 group-hover:text-[#5b7c99]">
                {user.name}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-[#5b7c99]"
            >
              logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
