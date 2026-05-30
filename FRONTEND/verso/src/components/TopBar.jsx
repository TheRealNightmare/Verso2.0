import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Check, X, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useNotifications } from '../context/NotificationsContext';
import { useToast } from '../context/ToastContext';
import Avatar from './ui/Avatar';
import { fetchBooks } from '../api/books';
import { searchUsers } from '../api/users';
import { acceptFriendRequest, declineFriendRequest } from '../api/friends';
import { resolveFileUrl } from '../lib/assets';

const TopBar = ({ onMenuClick = () => {} }) => {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const { requests, requestCount, removeRequest } = useNotifications();

  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Mobile: search collapses to an icon that expands into a full-width bar.
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Debounced combined search (books + people)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setBooks([]);
      setPeople([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [bookRes, userRes] = await Promise.allSettled([
          fetchBooks({ search: trimmed }),
          searchUsers(trimmed),
        ]);
        setBooks(
          bookRes.status === 'fulfilled' ? (bookRes.value?.data ?? []).slice(0, 5) : []
        );
        setPeople(
          userRes.status === 'fulfilled' ? (userRes.value?.data ?? []).slice(0, 5) : []
        );
        setOpen(true);
      } catch {
        setBooks([]);
        setPeople([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const closeSearch = () => {
    setQuery('');
    setBooks([]);
    setPeople([]);
    setOpen(false);
    setSearchOpen(false);
  };

  // Focus the input when the mobile search bar expands.
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSelectBook = (id) => {
    navigate(`/book/${id}`);
    closeSearch();
  };

  const handleSelectUser = (id) => {
    navigate(`/users/${id}`);
    closeSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeSearch();
  };

  const handleAccept = async (requestId, name) => {
    try {
      await acceptFriendRequest(requestId);
      removeRequest(requestId);
      toast.success(`You are now friends with ${name}`);
    } catch {
      toast.error('Could not accept request.');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await declineFriendRequest(requestId);
      removeRequest(requestId);
    } catch {
      toast.error('Could not decline request.');
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

  const noResults = !loading && books.length === 0 && people.length === 0;

  return (
    <header className="h-16 px-3 sm:px-6 flex items-center gap-2 sm:gap-4 bg-[#f8f6f2] border-b border-slate-200">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      <div
        className={`relative flex-1 max-w-md ${searchOpen ? 'block' : 'hidden'} sm:block`}
        ref={wrapperRef}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          ref={inputRef}
          type="search"
          aria-label="Search books and people"
          placeholder="Search books, people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-100 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30"
        />
        <button
          type="button"
          onClick={closeSearch}
          aria-label="Close search"
          className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
            {loading && <p className="px-4 py-3 text-xs text-slate-400">Searching…</p>}
            {noResults && <p className="px-4 py-3 text-xs text-slate-400">No results found.</p>}

            {people.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  People
                </p>
                {people.map((p) => (
                  <button
                    key={`u-${p.id}`}
                    type="button"
                    onClick={() => handleSelectUser(p.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="relative shrink-0">
                      <Avatar src={p.avatarUrl} name={p.name} className="w-8 h-8" textClass="text-xs" />
                      {p.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5">
                        <span className="truncate">{p.name}</span>
                        {p.role === 'author' && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">
                            Author
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.friendStatus === 'friends'
                          ? 'Friend'
                          : p.friendStatus === 'request_sent'
                          ? 'Request sent'
                          : p.friendStatus === 'request_received'
                          ? 'Wants to connect'
                          : p.online
                          ? 'Online'
                          : 'View profile'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {books.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Books
                </p>
                {books.map((book) => (
                  <button
                    key={`b-${book.id}`}
                    type="button"
                    onClick={() => handleSelectBook(book.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                  >
                    {book.cover_image_url && (
                      <img src={resolveFileUrl(book.cover_image_url)} alt="" className="w-8 h-10 object-cover rounded shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{book.title}</p>
                      {book.author && <p className="text-xs text-slate-400 truncate">{book.author}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`items-center gap-2 sm:gap-4 ml-auto ${searchOpen ? 'hidden sm:flex' : 'flex'}`}>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="sm:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100"
        >
          <Search size={20} />
        </button>

        <div className="relative" ref={bellRef}>
          <button
            type="button"
            aria-label="Friend requests"
            onClick={() => setBellOpen((v) => !v)}
            className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100"
          >
            <Bell size={20} />
            {requestCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {requestCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
              <p className="px-4 py-3 text-sm font-semibold text-slate-700 border-b border-slate-100">
                Friend requests
              </p>
              {requestCount === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">No pending requests.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {requests.map((r) => (
                    <li key={r.requestId} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          setBellOpen(false);
                          navigate(`/users/${r.user.id}`);
                        }}
                        className="shrink-0"
                      >
                        <Avatar src={r.user.avatarUrl} name={r.user.name} className="w-9 h-9" textClass="text-xs" />
                      </button>
                      <p className="flex-1 min-w-0 text-sm text-slate-700 truncate">{r.user.name}</p>
                      <button
                        type="button"
                        aria-label="Accept"
                        onClick={() => handleAccept(r.requestId, r.user.name)}
                        className="p-1.5 rounded-lg bg-[#5b7c99] text-white hover:bg-[#4a6a85]"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Decline"
                        onClick={() => handleDecline(r.requestId)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                      >
                        <X size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
              <span className="hidden sm:inline text-sm text-slate-700 group-hover:text-[#5b7c99]">{user.name}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline text-xs text-slate-500 hover:text-[#5b7c99]"
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
