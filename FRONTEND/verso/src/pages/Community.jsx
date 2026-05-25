import { useCallback, useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import CommunityInfoCard from '../components/community/CommunityInfoCard';
import CommunityMessageItem from '../components/community/CommunityMessageItem';
import MessageComposer from '../components/community/MessageComposer';
import {
  getCommunityInfo,
  listMessages,
  sendTextMessage,
  sendAudioMessage,
  sendImageMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  pingPresence,
} from '../api/community';
import { getEcho } from '../lib/echo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import usePageTitle from '../hooks/usePageTitle';

const INFO_POLL_MS = 8000;
const FEED_POLL_MS = 5000;
const PRESENCE_PING_MS = 30000;

const upsert = (list, msg) => (list.some((m) => m.id === msg.id) ? list : [...list, msg]);

const Community = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  usePageTitle('Community');
  const [info, setInfo] = useState(null);
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const feedEndRef = useRef(null);
  // Hold the current user id in a ref so the realtime effect (deps []) always
  // sees the latest value without re-subscribing to Echo.
  const userIdRef = useRef(user?.id);
  useEffect(() => { userIdRef.current = user?.id; }, [user]);

  const refreshInfo = useCallback(async () => {
    try { setInfo(await getCommunityInfo()); } catch (e) { /* non-fatal */ }
  }, []);

  const refreshFeed = useCallback(async () => {
    try {
      const { messages } = await listMessages({ limit: 50 });
      setFeed(messages);
    } catch (e) { setError(e?.message || 'Failed to load feed'); }
  }, []);

  // Initial load + polling fallback (keeps feed in sync even if the WebSocket drops)
  useEffect(() => {
    refreshInfo();
    refreshFeed();
    const i = setInterval(refreshInfo, INFO_POLL_MS);
    const f = setInterval(refreshFeed, FEED_POLL_MS);
    return () => { clearInterval(i); clearInterval(f); };
  }, [refreshInfo, refreshFeed]);

  useEffect(() => {
    pingPresence().catch(() => {});
    const id = setInterval(() => pingPresence().catch(() => {}), PRESENCE_PING_MS);
    return () => clearInterval(id);
  }, []);

  // Realtime via Echo
  useEffect(() => {
    let channel;
    try {
      const echo = getEcho();
      channel = echo.private('community');
      channel.listen('.message.sent', (data) => {
        if (data.parentId) return; // flat group chat — ignore thread replies
        // The broadcast payload's `mine` is computed for the sender, so recompute
        // it for this client to keep bubble alignment correct (no right→left flash).
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
    } catch (e) {
      console.warn('Echo init failed; falling back to polling.', e);
    }
    return () => {
      try { channel?.stopListening('.message.sent'); } catch {}
      try { channel?.stopListening('.message.updated'); } catch {}
      try { channel?.stopListening('.message.deleted'); } catch {}
      try { channel?.stopListening('.reaction.toggled'); } catch {}
      // Leave only the community channel; the Echo socket is shared app-wide
      // (used by NotificationsContext) and is torn down on logout instead.
      try { getEcho().leave('community'); } catch {}
    };
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length]);

  const handleSendText = async (body) => {
    try {
      const created = await sendTextMessage(body);
      setFeed((prev) => upsert(prev, created));
    } catch (e) { setError(e?.message || 'Failed to send'); }
  };

  const handleSendAudio = async (file, dur) => {
    try {
      const created = await sendAudioMessage(file, dur);
      setFeed((prev) => upsert(prev, created));
    } catch (e) { setError(e?.message || 'Failed to send audio'); }
  };

  const handleSendImage = async (file, caption) => {
    try {
      const created = await sendImageMessage(file, caption);
      setFeed((prev) => upsert(prev, created));
    } catch (e) { setError(e?.message || 'Failed to send image'); }
  };

  const handleReact = async (id, emoji) => {
    try {
      const { reactions } = await toggleReaction(id, emoji);
      setFeed((prev) => prev.map((m) => (m.id === id ? { ...m, reactions } : m)));
    } catch (e) { setError(e?.message || 'Failed to react'); }
  };

  const handleEdit = async (id, body) => {
    try {
      const updated = await editMessage(id, body);
      setFeed((prev) => prev.map((m) => (m.id === id ? { ...m, body: updated.body, editedAt: updated.editedAt } : m)));
    } catch (e) { setError(e?.message || 'Failed to edit'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete this message?',
      message: 'This message will be permanently removed from the feed.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteMessage(id);
      setFeed((prev) => prev.filter((m) => m.id !== id));
      toast.success('Message deleted');
    } catch (e) {
      setError(e?.message || 'Failed to delete');
      toast.error(e?.message || 'Failed to delete message.');
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-9rem)] sm:h-[calc(100vh-10rem)] bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Mobile backdrop for the info drawer */}
      {infoOpen && (
        <div
          className="absolute inset-0 z-10 bg-black/30 lg:hidden"
          onClick={() => setInfoOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`absolute inset-y-0 left-0 z-20 w-72 sm:w-80 max-w-[85%] bg-white border-r border-slate-200 flex flex-col p-4 overflow-y-auto transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:max-w-none ${
          infoOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end lg:hidden mb-1">
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            aria-label="Close info"
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>
        <CommunityInfoCard info={info} />
      </aside>

      <section className="flex-1 flex flex-col min-w-0">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="Community info"
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Info size={18} />
          </button>
          <div className="text-sm font-semibold text-slate-800">Community feed</div>
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
          placeholder="Message the community"
        />

        {error && (
          <div className="px-4 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" className="text-red-400 hover:text-red-600" onClick={() => setError(null)}>×</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Community;
