import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Lock, Globe, X, LogIn } from 'lucide-react';
import {
  listRooms,
  createRoom,
  joinRoom,
  joinByCode,
} from '../api/readingRooms';
import { fetchBooks } from '../api/books';
import { useToast } from '../context/ToastContext';
import usePageTitle from '../hooks/usePageTitle';
import Spinner from '../components/ui/Spinner';

const asArray = (res) => (Array.isArray(res) ? res : res?.data || []);

const RoomCard = ({ room, onOpen, onJoin }) => (
  <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-slate-200">
      {room.book?.coverUrl && (
        <img src={room.book.coverUrl} alt="" className="h-full w-full object-cover" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        {room.visibility === 'private' ? <Lock size={13} className="text-slate-400" /> : <Globe size={13} className="text-slate-400" />}
        <h3 className="truncate text-sm font-semibold text-[#2c3e50]">{room.name}</h3>
      </div>
      <p className="truncate text-[12px] text-slate-500">{room.book?.title}</p>
      <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-slate-400">
        <Users size={12} /> {room.memberCount} member{room.memberCount === 1 ? '' : 's'}
      </p>
      <div className="mt-2">
        {room.isMember ? (
          <button
            onClick={() => onOpen(room)}
            className="rounded-lg bg-[#5b7c99] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#4a6884]"
          >
            Open room
          </button>
        ) : (
          <button
            onClick={() => onJoin(room)}
            className="rounded-lg bg-[#5b7c99] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#4a6884]"
          >
            Join
          </button>
        )}
      </div>
    </div>
  </div>
);

const CreateRoomModal = ({ onClose, onCreated }) => {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBooks({ limit: 100 }).then((res) => setBooks(asArray(res))).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!bookId || !name.trim()) return;
    setSaving(true);
    try {
      const room = await createRoom({
        book_id: Number(bookId),
        name: name.trim(),
        visibility,
      });
      onCreated(room);
    } catch (err) {
      toast.error(err?.message || 'Failed to create room');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#2c3e50]">New reading room</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-[#5b7c99]"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label className="text-[13px] font-medium text-[#2c3e50]">
            Book
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-[13px]"
            >
              <option value="">Choose a catalog book…</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </label>
          <label className="text-[13px] font-medium text-[#2c3e50]">
            Room name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Friday night Dune club"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-[13px]"
            />
          </label>
          <fieldset className="flex gap-4 text-[13px] text-[#2c3e50]">
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} />
              <Globe size={14} /> Public
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" checked={visibility === 'private'} onChange={() => setVisibility('private')} />
              <Lock size={14} /> Private
            </label>
          </fieldset>
          <button
            type="submit"
            disabled={saving || !bookId || !name.trim()}
            className="mt-1 rounded-lg bg-[#5b7c99] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a6884] disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create room'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ReadingRooms = () => {
  usePageTitle('Reading Rooms');
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState('mine');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');

  const load = useCallback(async (scope) => {
    setLoading(true);
    try {
      const res = await listRooms({ scope, type: 'reading' });
      setRooms(asArray(res));
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab === 'discover' ? 'public' : 'mine');
  }, [tab, load]);

  const openRoom = (room) => navigate(`/rooms/${room.id}/read`);

  const handleJoin = async (room) => {
    try {
      await joinRoom(room.id);
      openRoom(room);
    } catch (err) {
      toast.error(err?.message || 'Could not join room');
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    try {
      const room = await joinByCode(c);
      setCode('');
      navigate(`/rooms/${room.id}/read`);
    } catch (err) {
      toast.error(err?.message || 'Invalid invite code');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-[#2c3e50]">Reading Rooms</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#5b7c99] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a6884]"
        >
          <Plus size={16} /> New room
        </button>
      </div>

      <form onSubmit={handleJoinByCode} className="mt-4 flex max-w-sm gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Have an invite code?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-[#2c3e50] px-3 py-2 text-sm font-medium text-white hover:bg-[#1e2d3d]"
        >
          <LogIn size={15} /> Join
        </button>
      </form>

      <div className="mt-5 flex gap-2 border-b border-slate-200">
        {['mine', 'discover'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? 'border-b-2 border-[#5b7c99] text-[#5b7c99]' : 'text-slate-500 hover:text-[#5b7c99]'
            }`}
          >
            {t === 'mine' ? 'My Rooms' : 'Discover'}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <Spinner label="Loading rooms…" />
        ) : rooms.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            {tab === 'mine' ? 'You haven’t joined any rooms yet.' : 'No public rooms yet — create one!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onOpen={openRoom} onJoin={handleJoin} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(room) => {
            setShowCreate(false);
            navigate(`/rooms/${room.id}/read`);
          }}
        />
      )}
    </div>
  );
};

export default ReadingRooms;
