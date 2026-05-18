import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopBar = () => {
  const { user, logout } = useAuth();

  const avatarUrl = 'https://i.pravatar.cc/64?img=12';

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-[#f8f6f2] border-b border-slate-200">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search book, name, author..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100">
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
            <img
              src={avatarUrl}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow shrink-0"
            />
            <span className="text-sm text-slate-700 cursor-pointer hover:text-[#5b7c99]" onClick={logout}>
              {user.name} (logout)
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
