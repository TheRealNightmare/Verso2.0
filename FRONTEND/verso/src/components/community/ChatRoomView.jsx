import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Users, Settings, LogOut, Lock, Globe } from 'lucide-react';
import CommunityMessageItem from './CommunityMessageItem';
import MessageComposer from './MessageComposer';
import RoomMembersPanel from '../room/RoomMembersPanel';
import RoomSettingsModal from '../room/RoomSettingsModal';
import InviteFriendsModal from '../room/InviteFriendsModal';
import {
  getRoom,
  listRoomMessages,
  sendRoomText,
  sendRoomAudio,
  sendRoomImage,
  editRoomMessage,
  deleteRoomMessage,
  toggleRoomReaction,
  leaveRoom,
  kickMember,
} from '../../api/readingRooms';
import { getEcho } from '../../lib/echo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const FEED_FALLBACK_POLL_MS = 15000;
const upsert = (list, msg) => (list.some((m) => m.id === msg.id) ? list : [...list, msg]);

// In-room chat for a standalone (book-less) community chat room. Owns the Echo
// subscription for one room channel + presence, mirroring the Community feed.
const ChatRoomView = ({ roomId, onExit }) => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [feed, setFeed] = useState([]);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const feedEndRef = useRef(null);
  const userIdRef = useRef(user?.id);
  useEffect(() => { userIdRef.current = user?.id; }, [user]);
  const realtimeRef = useRef(false);
  // Stable exit ref so the realtime effect (deps [roomId]) can eject on kick.
  const onExitRef = useRef(onExit);
  useEffect(() => { onExitRef.current = onExit; }, [onExit]);

  const isOwner = room?.isOwner;

  const refreshFeed = useCallback(async () => {
    try {
      const res = await listRoomMessages(roomId, { limit: 50 });
      setFeed(res?.messages || []);
    } catch (e) { setError(e?.message || 'Failed to load messages'); }
  }, [roomId]);

  // Initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [detail, msgs] = await Promise.all([
          getRoom(roomId),
          listRoomMessages(roomId, { limit: 50 }),
        ]);
        if (!alive) return;
        setRoom(detail?.room || null);
        setMembers(detail?.members || []);
        setFeed(msgs?.messages || []);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load room');
      }
    })();
    return () => { alive = false; };
  }, [roomId]);

  // Polling fallback while the socket is down
  useEffect(() => {
    const f = setInterval(() => { if (!realtimeRef.current) refreshFeed(); }, FEED_FALLBACK_POLL_MS);
    return () => clearInterval(f);
  }, [refreshFeed]);

  // Realtime via Echo (private room channel + presence)
  useEffect(() => {
    let channel;
    let presence;
    let conn;
    let onState;
    const chanName = `reading-room.${roomId}`;
    try {
      const echo = getEcho();
      conn = echo.connector?.pusher?.connection;
      if (conn) {
        onState = () => {
          const wasDown = !realtimeRef.current;
          realtimeRef.current = conn.state === 'connected';
          if (realtimeRef.current && wasDown) refreshFeed();
        };
        onState();
        conn.bind('state_change', onState);
      }

      channel = echo.private(chanName);
      channel.listen('.message.sent', (data) => {
        const msg = { ...data, mine: data.author?.id === userIdRef.current };
        setFeed((prev) => upsert(prev, msg));
      });
      channel.listen('.message.updated', (data) => {
        setFeed((prev) => prev.map((m) => (m.id === data.id ? { ...m, body: data.body, editedAt: data.editedAt } : m)));
      });
      channel.listen('.message.deleted', (data) => {
        setFeed((prev) => prev.filter((m) => m.id !== data.id));
      });
      channel.listen('.reaction.toggled', (data) => {
        setFeed((prev) => prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m)));
      });
      channel.listen('.message.spoiler', (data) => {
        setFeed((prev) => prev.map((m) => (m.id === data.id ? { ...m, isSpoiler: data.isSpoiler } : m)));
      });
      channel.listen('.member.joined', (data) => {
        setMembers((prev) => (prev.some((m) => m.userId === data.userId) ? prev : [...prev, data]));
      });
      channel.listen('.member.left', (data) => {
        // Ejected (kicked or left): if it's me, exit the room view.
        if (data.userId === userIdRef.current) {
          toast.show('You are no longer in this room.');
          onExitRef.current?.();
          return;
        }
        setMembers((prev) => prev.filter((m) => m.userId !== data.userId));
      });

      presence = echo.join(chanName)
        .here((users) => setOnlineIds(new Set(users.map((u) => u.id))))
        .joining((u) => setOnlineIds((prev) => new Set(prev).add(u.id)))
        .leaving((u) => setOnlineIds((prev) => { const n = new Set(prev); n.delete(u.id); return n; }));
    } catch (e) {
      console.warn('Echo init failed; falling back to polling.', e);
    }

    return () => {
      realtimeRef.current = false;
      try { if (conn && onState) conn.unbind('state_change', onState); } catch {}
      try {
        ['.message.sent', '.message.updated', '.message.deleted', '.reaction.toggled',
          '.message.spoiler', '.member.joined', '.member.left'].forEach((ev) => channel?.stopListening(ev));
      } catch {}
      try { getEcho().leave(chanName); } catch {}
      try { getEcho().leave(`presence-${chanName}`); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, refreshFeed]);

  // --- Chat handlers ---
  const upsertChat = (msg) => setFeed((prev) => upsert(prev, msg));
  const handleSendText = async (body, isSpoiler = false) => {
    try { upsertChat(await sendRoomText(roomId, body, isSpoiler)); } catch (e) { setError(e?.message || 'Failed to send'); }
  };
  const handleSendAudio = async (file, dur) => {
    try { upsertChat(await sendRoomAudio(roomId, file, dur)); } catch (e) { setError(e?.message || 'Failed to send audio'); }
  };
  const handleSendImage = async (file, caption, isSpoiler = false) => {
    try { upsertChat(await sendRoomImage(roomId, file, caption, isSpoiler)); } catch (e) { setError(e?.message || 'Failed to send image'); }
  };
  const handleReact = async (msgId, emoji) => {
    try { const { reactions } = await toggleRoomReaction(roomId, msgId, emoji); setFeed((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions } : m))); } catch (e) { setError(e?.message || 'Failed to react'); }
  };
  const handleEdit = async (msgId, body) => {
    try { const u = await editRoomMessage(roomId, msgId, body); setFeed((prev) => prev.map((m) => (m.id === msgId ? { ...m, body: u.body, editedAt: u.editedAt } : m))); } catch (e) { setError(e?.message || 'Failed to edit'); }
  };
  const handleDelete = async (msgId) => {
    const ok = await confirm({ title: 'Delete this message?', message: 'This message will be permanently removed.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try { await deleteRoomMessage(roomId, msgId); setFeed((prev) => prev.filter((m) => m.id !== msgId)); } catch (e) { setError(e?.message || 'Failed to delete'); }
  };

  const handleKick = async (targetId) => {
    const ok = await confirm({ title: 'Remove this member?', message: 'They will lose access to the room.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    try {
      await kickMember(roomId, targetId);
      setMembers((prev) => prev.filter((m) => m.userId !== targetId));
    } catch (e) { toast.error(e?.message || 'Failed to remove member'); }
  };

  const handleLeave = async () => {
    const ok = await confirm({ title: 'Leave this room?', message: 'You can rejoin later with an invite code.', confirmLabel: 'Leave', danger: true });
    if (!ok) return;
    try { await leaveRoom(roomId); toast.success('Left room'); onExit?.(); }
    catch (e) { toast.error(e?.message || 'Failed to leave'); }
  };

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length]);

  return (
    <div className="relative flex h-[calc(100vh-9rem)] sm:h-[calc(100vh-10rem)] bg-white rounded-xl overflow-hidden shadow-sm">
      <section className="flex-1 flex flex-col min-w-0">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <button onClick={onExit} aria-label="Back to rooms" className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {room?.visibility === 'private' ? <Lock size={13} className="text-slate-400" /> : <Globe size={13} className="text-slate-400" />}
              <span className="truncate text-sm font-semibold text-slate-800">{room?.name || 'Room'}</span>
            </div>
          </div>
          <button onClick={() => setMembersOpen((v) => !v)} aria-label="Members" className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <Users size={18} /> <span className="text-xs">{room?.memberCount ?? members.length}</span>
          </button>
          {isOwner ? (
            <button onClick={() => setSettingsOpen(true)} aria-label="Room settings" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
              <Settings size={18} />
            </button>
          ) : (
            <button onClick={handleLeave} aria-label="Leave room" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
              <LogOut size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {feed.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-10">No messages yet — say hi 👋</div>
          ) : (
            feed.map((m) => (
              <CommunityMessageItem
                key={m.id}
                message={m}
                onReact={handleReact}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
          <div ref={feedEndRef} />
        </div>

        <MessageComposer
          onSendText={handleSendText}
          onSendAudio={handleSendAudio}
          onSendImage={handleSendImage}
          placeholder="Message the room"
        />

        {error && (
          <div className="px-4 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" className="text-red-400 hover:text-red-600" onClick={() => setError(null)}>×</button>
          </div>
        )}
      </section>

      {membersOpen && (
        <>
          <div className="absolute inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMembersOpen(false)} aria-hidden />
          <RoomMembersPanel
            members={members}
            onlineIds={onlineIds}
            currentUserId={user?.id}
            onInvite={() => setInviteOpen(true)}
            onClose={() => setMembersOpen(false)}
            showLocation={false}
            canManage={isOwner}
            onKick={handleKick}
          />
        </>
      )}

      {settingsOpen && room && (
        <RoomSettingsModal
          room={room}
          onClose={() => setSettingsOpen(false)}
          onUpdated={(updated) => setRoom((prev) => ({ ...prev, ...updated }))}
          onDeleted={() => { setSettingsOpen(false); onExit?.(); }}
        />
      )}

      {inviteOpen && room && (
        <InviteFriendsModal
          roomId={roomId}
          joinCode={room.joinCode}
          roomType="chat"
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatRoomView;
