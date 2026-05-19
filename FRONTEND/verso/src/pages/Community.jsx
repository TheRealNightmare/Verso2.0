import { useCallback, useEffect, useRef, useState } from 'react';
import CommunityInfoCard from '../components/community/CommunityInfoCard';
import RecentThreads from '../components/community/RecentThreads';
import CommunityMessageItem from '../components/community/CommunityMessageItem';
import MessageComposer from '../components/community/MessageComposer';
import ThreadView from '../components/community/ThreadView';
import {
  getCommunityInfo,
  listMessages,
  listThreads,
  sendTextMessage,
  sendAudioMessage,
  sendImageMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  pingPresence,
} from '../api/community';
import { getEcho, disconnectEcho } from '../lib/echo';

const INFO_POLL_MS = 8000;
const THREADS_POLL_MS = 12000;
const PRESENCE_PING_MS = 30000;

const Community = () => {
  const [info, setInfo] = useState(null);
  const [feed, setFeed] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threadParent, setThreadParent] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState(null);
  const feedEndRef = useRef(null);

  const refreshInfo = useCallback(async () => {
    try { setInfo(await getCommunityInfo()); } catch (e) { /* non-fatal */ }
  }, []);

  const refreshFeed = useCallback(async () => {
    try {
      const { messages } = await listMessages({ limit: 50 });
      setFeed(messages);
    } catch (e) { setError(e?.message || 'Failed to load feed'); }
  }, []);

  const refreshThreads = useCallback(async () => {
    try {
      const { threads: list } = await listThreads(20);
      setThreads(list);
    } catch (e) { /* non-fatal */ }
  }, []);

  const refreshThread = useCallback(async (parentId) => {
    try {
      const { parent, messages } = await listMessages({ parentId, limit: 200 });
      setThreadParent(parent);
      setThreadReplies(messages);
    } catch (e) { setError(e?.message || 'Failed to load thread'); }
  }, []);

  useEffect(() => {
    refreshInfo();
    refreshFeed();
    refreshThreads();
    const i = setInterval(refreshInfo, INFO_POLL_MS);
    const t = setInterval(refreshThreads, THREADS_POLL_MS);
    return () => { clearInterval(i); clearInterval(t); };
  }, [refreshInfo, refreshFeed, refreshThreads]);

  useEffect(() => {
    pingPresence().catch(() => {});
    const id = setInterval(() => pingPresence().catch(() => {}), PRESENCE_PING_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeThreadId) return undefined;
    refreshThread(activeThreadId);
    return undefined;
  }, [activeThreadId, refreshThread]);

  // Realtime via Echo
  useEffect(() => {
    let channel;
    try {
      const echo = getEcho();
      channel = echo.private('community');
      channel.listen('.message.sent', (data) => {
        if (data.parentId) {
          if (activeThreadId === data.parentId) {
            setThreadReplies((prev) => [...prev, data]);
          }
          setThreads((prev) => prev.map((t) => t.id === data.parentId ? { ...t, replyCount: (t.replyCount || 0) + 1 } : t));
        } else {
          setFeed((prev) => [...prev, data]);
          setThreads((prev) => [{ ...data, replyCount: 0 }, ...prev].slice(0, 20));
        }
      });
      channel.listen('.message.updated', (data) => {
        const apply = (m) => m.id === data.id ? { ...m, body: data.body, editedAt: data.editedAt } : m;
        setFeed((prev) => prev.map(apply));
        setThreads((prev) => prev.map(apply));
        setThreadReplies((prev) => prev.map(apply));
        setThreadParent((prev) => prev && prev.id === data.id ? { ...prev, body: data.body, editedAt: data.editedAt } : prev);
      });
      channel.listen('.message.deleted', (data) => {
        const drop = (list) => list.filter((m) => m.id !== data.id);
        setFeed(drop);
        setThreads(drop);
        setThreadReplies(drop);
        if (activeThreadId === data.id) { setActiveThreadId(null); setThreadParent(null); setThreadReplies([]); }
      });
      channel.listen('.reaction.toggled', (data) => {
        const apply = (m) => m.id === data.messageId ? { ...m, reactions: data.reactions } : m;
        setFeed((prev) => prev.map(apply));
        setThreads((prev) => prev.map(apply));
        setThreadReplies((prev) => prev.map(apply));
        setThreadParent((prev) => prev && prev.id === data.messageId ? { ...prev, reactions: data.reactions } : prev);
      });
    } catch (e) {
      console.warn('Echo init failed; falling back to polling.', e);
    }
    return () => {
      try { channel?.stopListening('.message.sent'); } catch {}
      try { channel?.stopListening('.message.updated'); } catch {}
      try { channel?.stopListening('.message.deleted'); } catch {}
      try { channel?.stopListening('.reaction.toggled'); } catch {}
      disconnectEcho();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length, threadReplies.length, activeThreadId]);

  const handleSendText = async (body) => {
    const parentId = replyTo?.id || activeThreadId || null;
    try {
      const created = await sendTextMessage(body, parentId);
      if (parentId) {
        if (activeThreadId === parentId) setThreadReplies((prev) => [...prev, created]);
        setThreads((prev) => prev.map((t) => t.id === parentId ? { ...t, replyCount: (t.replyCount || 0) + 1 } : t));
      } else {
        setFeed((prev) => [...prev, created]);
        refreshThreads();
      }
      setReplyTo(null);
    } catch (e) { setError(e?.message || 'Failed to send'); }
  };

  const handleSendAudio = async (file, dur) => {
    const parentId = replyTo?.id || activeThreadId || null;
    try {
      const created = await sendAudioMessage(file, dur, parentId);
      if (parentId) {
        if (activeThreadId === parentId) setThreadReplies((prev) => [...prev, created]);
      } else {
        setFeed((prev) => [...prev, created]);
        refreshThreads();
      }
      setReplyTo(null);
    } catch (e) { setError(e?.message || 'Failed to send audio'); }
  };

  const handleSendImage = async (file, caption) => {
    const parentId = replyTo?.id || activeThreadId || null;
    try {
      const created = await sendImageMessage(file, caption, parentId);
      if (parentId) {
        if (activeThreadId === parentId) setThreadReplies((prev) => [...prev, created]);
      } else {
        setFeed((prev) => [...prev, created]);
        refreshThreads();
      }
      setReplyTo(null);
    } catch (e) { setError(e?.message || 'Failed to send image'); }
  };

  const handleReact = async (id, emoji) => {
    try {
      const { reactions } = await toggleReaction(id, emoji);
      const apply = (m) => m.id === id ? { ...m, reactions } : m;
      setFeed((prev) => prev.map(apply));
      setThreads((prev) => prev.map(apply));
      setThreadReplies((prev) => prev.map(apply));
      setThreadParent((prev) => prev && prev.id === id ? { ...prev, reactions } : prev);
    } catch (e) { setError(e?.message || 'Failed to react'); }
  };

  const handleEdit = async (id, body) => {
    try {
      const updated = await editMessage(id, body);
      const apply = (m) => m.id === id ? { ...m, body: updated.body, editedAt: updated.editedAt } : m;
      setFeed((prev) => prev.map(apply));
      setThreads((prev) => prev.map(apply));
      setThreadReplies((prev) => prev.map(apply));
      setThreadParent((prev) => prev && prev.id === id ? { ...prev, body: updated.body, editedAt: updated.editedAt } : prev);
    } catch (e) { setError(e?.message || 'Failed to edit'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMessage(id);
      const drop = (list) => list.filter((m) => m.id !== id);
      setFeed(drop);
      setThreads(drop);
      setThreadReplies(drop);
      if (activeThreadId === id) { setActiveThreadId(null); setThreadParent(null); setThreadReplies([]); }
    } catch (e) { setError(e?.message || 'Failed to delete'); }
  };

  const openThread = (id) => setActiveThreadId(id);
  const clearThread = () => { setActiveThreadId(null); setThreadParent(null); setThreadReplies([]); setReplyTo(null); };

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white rounded-xl overflow-hidden shadow-sm">
      <aside className="w-80 border-r border-slate-200 flex flex-col p-4 overflow-y-auto">
        <CommunityInfoCard info={info} />
        <RecentThreads
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={openThread}
          onClear={clearThread}
        />
      </aside>

      <section className="flex-1 flex flex-col">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">
            {activeThreadId ? 'Thread' : 'Community feed'}
          </div>
          {activeThreadId && (
            <button
              type="button"
              onClick={clearThread}
              className="text-xs text-[#4f83cc] hover:underline"
            >
              ← Back to feed
            </button>
          )}
        </div>

        {activeThreadId ? (
          <ThreadView
            parent={threadParent}
            replies={threadReplies}
            onReact={handleReact}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {feed.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-10">No messages yet — say hi 👋</div>
            ) : (
              feed.map((m) => (
                <CommunityMessageItem
                  key={m.id}
                  message={m}
                  showReplyCount
                  onReply={(id) => { setReplyTo({ id, authorName: m.author?.name }); openThread(id); }}
                  onOpenThread={openThread}
                  onReact={handleReact}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
            <div ref={feedEndRef} />
          </div>
        )}

        <MessageComposer
          onSendText={handleSendText}
          onSendAudio={handleSendAudio}
          onSendImage={handleSendImage}
          placeholder={activeThreadId ? 'Reply in thread…' : 'Message the community'}
          replyingTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
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
