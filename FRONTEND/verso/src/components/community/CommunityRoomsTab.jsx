import { useCallback, useEffect, useState } from 'react';
import { Plus, Users, Lock, Globe, X, LogIn } from 'lucide-react';
import { listRooms, createRoom, joinRoom, joinByCode } from '../../api/readingRooms';
import { useToast } from '../../context/ToastContext';
import Spinner from '../ui/Spinner';
import ChatRoomView from './ChatRoomView';

const asArray = (res) => (Array.isArray(res) ? res : res?.data || []);

const RoomCard = ({ room, onOpen, onJoin }) => (
  <div className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-center gap-1.5">
      {room.visibility === 'private' ? <Lock size={13} className="text-slate-400" /> : <Globe size={13} className="text-slate-400" />}
      <h3 className="truncate text-sm font-semibold text-[#2c3e50]">{room.name}</h3>
    </div>
    {room.description && <p className="line-clamp-2 text-[12px] text-slate-500">{room.description}</p>}
    <p className="inline-flex items-center gap-1 text-[12px] text-slate-400">
      <Users size={12} /> {room.memberCount} member{room.memberCount === 1 ? '' : 's'}
    </p>
    <div>
      <button
        onClick={() => (room.isMember ? onOpen(room) : onJoin(room))}
        className="rounded-lg bg-[#5b7c99] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#4a6884]"
      >
        {room.isMember ? 'Open chat' : 'Join'}
      </button>
    </div>
  </div>
);

const CreateRoomModal = ({ onClose, onCreated }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const room = await createRoom({
        type: 'chat',
        name: name.trim(),
        description: description.trim() || null,
        visibility,
      });
      onCreated(room);
    } catch (err) {
      toast.error(err?.message || 'Failed to create room');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#2c3e50]">New chat room</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-[#5b7c99]"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label className="text-[13px] font-medium text-[#2c3e50]">
            Room name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Late-night sci-fi chat"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-[13px]"
            />
          </label>
          <label className="text-[13px] font-medium text-[#2c3e50]">
            Description <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="What's this room about?"
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
            disabled={saving || !name.trim()}
            className="mt-1 rounded-lg bg-[#5b7c99] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a6884] disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create room'}
          </button>
        </form>
      </div>
    </div>
  );
};

const CommunityRoomsTab = () => {
  const toast = useToast();
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [tab, setTab] = useState('mine');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');

  const load = useCallback(async (scope) => {
    setLoading(true);
    try {
      const res = await listRooms({ scope, type: 'chat' });
      setRooms(asArray(res));
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeRoomId) return; // list refreshes when we return from a room
    load(tab === 'discover' ? 'public' : 'mine');
  }, [tab, load, activeRoomId]);

  const handleJoin = async (room) => {
    try {
      await joinRoom(room.id);
      setActiveRoomId(room.id);
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
      setActiveRoomId(room.id);
    } catch (err) {
      toast.error(err?.message || 'Invalid invite code');
    }
  };

  if (activeRoomId) {
    return <ChatRoomView roomId={activeRoomId} onExit={() => setActiveRoomId(null)} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#2c3e50]">Chat rooms</h2>
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
            {tab === 'mine' ? 'You haven’t joined any chat rooms yet.' : 'No public chat rooms yet — create one!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onOpen={(r) => setActiveRoomId(r.id)} onJoin={handleJoin} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(room) => {
            setShowCreate(false);
            setActiveRoomId(room.id);
          }}
        />
      )}
    </div>
  );
};

export default CommunityRoomsTab;
