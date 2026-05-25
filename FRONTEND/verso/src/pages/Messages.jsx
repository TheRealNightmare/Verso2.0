import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import { getInbox, getThread, sendDirectMessage, markThreadRead } from '../api/messages';
import { useNotifications } from '../context/NotificationsContext';
import { useToast } from '../context/ToastContext';
import usePageTitle from '../hooks/usePageTitle';

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const Messages = () => {
  const { userId } = useParams();
  const activeId = userId ? Number(userId) : null;
  const navigate = useNavigate();
  const toast = useToast();
  const { subscribeDM, refreshUnread } = useNotifications();

  const [conversations, setConversations] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);

  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [threadError, setThreadError] = useState('');

  const scrollRef = useRef(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  usePageTitle('Messages');

  const loadInbox = useCallback(async () => {
    try {
      const res = await getInbox();
      setConversations(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  // Load the open thread.
  useEffect(() => {
    if (!activeId) {
      setPartner(null);
      setMessages([]);
      return;
    }
    let active = true;
    setLoadingThread(true);
    setThreadError('');
    getThread(activeId)
      .then((res) => {
        if (!active) return;
        setPartner(res.partner);
        setMessages(res.messages || []);
        refreshUnread();
        loadInbox();
      })
      .catch((err) => {
        if (!active) return;
        setThreadError(err?.message || 'You can only message friends.');
        setPartner(null);
        setMessages([]);
      })
      .finally(() => active && setLoadingThread(false));
    return () => {
      active = false;
    };
  }, [activeId, refreshUnread, loadInbox]);

  // Auto-scroll to newest.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingThread]);

  // Live incoming messages.
  useEffect(() => {
    const unsub = subscribeDM((payload) => {
      if (payload.partnerId === activeIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        markThreadRead(activeIdRef.current).then(refreshUnread);
        loadInbox();
        return true; // handled — don't bump global unread
      }
      loadInbox(); // a different conversation got a message; refresh list
      return false;
    });
    return unsub;
  }, [subscribeDM, refreshUnread, loadInbox]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    setDraft('');
    try {
      const msg = await sendDirectMessage(activeId, body);
      setMessages((prev) => [...prev, msg]);
      loadInbox();
    } catch {
      toast.error('Could not send message.');
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-9rem)] md:h-[calc(100vh-10rem)]">
      <div className="flex h-full rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Inbox */}
        <aside
          className={`w-full md:w-72 border-r border-slate-200 flex flex-col ${
            activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <h2 className="px-4 py-3 text-sm font-semibold text-slate-700 border-b border-slate-100">
            Messages
          </h2>
          <div className="flex-1 overflow-y-auto">
            {loadingInbox ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-slate-400">
                No conversations yet. Visit a friend's profile to start chatting.
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.user.id}
                  type="button"
                  onClick={() => navigate(`/messages/${c.user.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                    c.user.id === activeId ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={c.user.avatarUrl} name={c.user.name} className="w-10 h-10" textClass="text-xs" />
                    {c.user.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {c.lastMessage.mine ? 'You: ' : ''}
                      {c.lastMessage.body}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#5b7c99] text-[10px] font-semibold text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={`flex-1 flex flex-col min-w-0 ${activeId ? 'flex' : 'hidden md:flex'}`}>
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={40} />
              <p className="mt-3 text-sm">Select a conversation</p>
            </div>
          ) : loadingThread ? (
            <div className="flex-1 flex justify-center items-center">
              <Spinner />
            </div>
          ) : threadError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6 text-center">
              <p className="text-sm">{threadError}</p>
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="mt-3 text-sm text-[#5b7c99] hover:underline"
              >
                Back to messages
              </button>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/messages')}
                  className="md:hidden p-1 text-slate-500 hover:text-slate-700"
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/users/${partner?.id}`)}
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    <Avatar src={partner?.avatarUrl} name={partner?.name} className="w-9 h-9" textClass="text-xs" />
                    {partner?.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-800">{partner?.name}</p>
                    <p className="text-xs text-slate-400">{partner?.online ? 'Online' : 'Offline'}</p>
                  </div>
                </button>
              </header>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f8f6f2]">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          m.mine
                            ? 'bg-[#5b7c99] text-white rounded-br-sm'
                            : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-0.5 text-[10px] ${m.mine ? 'text-white/70' : 'text-slate-400'}`}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2 rounded-full bg-slate-100 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="p-2.5 rounded-full bg-[#5b7c99] text-white hover:bg-[#4a6a85] disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
