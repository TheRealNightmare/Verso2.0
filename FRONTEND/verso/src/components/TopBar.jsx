import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import Avatar from './ui/Avatar';
import { fetchBooks } from '../api/books';

const TopBar = () => {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchBooks({ search: trimmed });
        const books = (res?.data ?? []).slice(0, 5);
        setResults(books);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (id) => {
    navigate(`/book/${id}`);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setResults([]);
    }
  };

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
      <div className="relative flex-1 max-w-md" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="search"
          aria-label="Search books, names, authors"
          placeholder="Search book, name, author..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30"
        />
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
            {loading && (
              <p className="px-4 py-3 text-xs text-slate-400">Searching…</p>
            )}
            {!loading && results.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-400">No books found.</p>
            )}
            {!loading && results.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => handleSelect(book.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
              >
                {book.cover_image_url && (
                  <img
                    src={book.cover_image_url}
                    alt=""
                    className="w-8 h-10 object-cover rounded shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{book.title}</p>
                  {book.author && (
                    <p className="text-xs text-slate-400 truncate">{book.author}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
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
              <Avatar
                src={user?.avatarUrl}
                name={user.name}
                className="w-9 h-9 ring-2 ring-white shadow"
                textClass="text-xs"
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
