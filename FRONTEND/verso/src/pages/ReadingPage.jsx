import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, BookMarked, Edit3, Trash2, X, Settings2, Users, MessageCircle } from 'lucide-react';
import { fetchBookContent } from '../api/content';
import { saveHistory, fetchHistoryEntry } from '../api/history';
import {
  fetchAnnotations,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from '../api/annotations';
import {
  getRoom,
  listRoomHighlights,
  createRoomHighlight,
  deleteRoomHighlight,
  updateProgress,
  inviteFriend,
  listHighlightComments,
  addHighlightComment,
  deleteComment,
  listRoomMessages,
  sendRoomText,
  sendRoomAudio,
  sendRoomImage,
  editRoomMessage,
  deleteRoomMessage,
  toggleRoomReaction,
} from '../api/readingRooms';
import { listFriends } from '../api/friends';
import Spinner from '../components/ui/Spinner';
import usePageTitle from '../hooks/usePageTitle';
import useReadingSession from '../hooks/useReadingSession';
import ReaderSettingsPanel from '../components/reader/ReaderSettingsPanel';
import AnnotationToolbar from '../components/reader/AnnotationToolbar';
import GeminiAskPanel from '../components/reader/GeminiAskPanel';
import RoomMembersPanel from '../components/room/RoomMembersPanel';
import RoomChatPanel from '../components/room/RoomChatPanel';
import HighlightThread from '../components/room/HighlightThread';
import { getTextOffset, renderWithHighlights } from '../components/reader/textHighlight';
import { DEFAULT_HIGHLIGHT_COLOR as DEFAULT_COLOR } from '../components/reader/annotationColors';
import { useReaderSettings, SINGLE_COLUMN_SCALE } from '../context/ReaderSettingsContext';
import { getThemeColors } from '../components/reader/readerThemes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getEcho } from '../lib/echo';

const CHARS_PER_PAGE = 1800;

function chaptersToPages(chapters) {
  const pages = [];
  for (const ch of chapters || []) {
    const text = (ch.content || '').trim();
    if (!text) {
      pages.push({ chapter: ch.number, chapterTitle: ch.title, left: '', right: '' });
      continue;
    }
    for (let i = 0; i < text.length; i += CHARS_PER_PAGE * 2) {
      const slice = text.slice(i, i + CHARS_PER_PAGE * 2);
      const mid = Math.floor(slice.length / 2);
      const splitAt = slice.lastIndexOf(' ', mid + 100) > mid - 100
        ? slice.lastIndexOf(' ', mid + 100)
        : mid;
      pages.push({
        chapter: ch.number,
        chapterTitle: ch.title,
        left: slice.slice(0, splitAt).trim(),
        right: slice.slice(splitAt).trim(),
      });
    }
  }
  return pages;
}

// Map a room highlight (camelCase API shape) into the snake_case shape the
// renderer + per-page filtering already expect, tagged with room:true.
function normalizeRoomHighlight(a) {
  return {
    id: a.id,
    page_index: a.pageIndex,
    column: a.column,
    start_offset: a.startOffset,
    end_offset: a.endOffset,
    selected_text: a.selectedText,
    note: a.note,
    color: a.color,
    commentCount: a.commentCount ?? 0,
    author: a.author,
    room: true,
  };
}

const ReadingPage = () => {
  const navigate = useNavigate();
  const { id, roomId } = useParams();
  const roomMode = !!roomId;
  const { user } = useAuth();
  const toast = useToast();

  // In room mode the book id comes from the room; resolved after it loads.
  const [bookId, setBookId] = useState(roomMode ? null : Number(id));

  // Track time spent reading this book so the dashboard can report it.
  useReadingSession({ bookId });

  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  usePageTitle(roomMode ? 'Reading Room' : 'Reading');
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true); // mobile: toggle header/footer
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Reader appearance settings (font size, background theme).
  const { fontScale, theme, bgColor, textColor } = useReaderSettings();
  const { bg, text } = getThemeColors({ theme, bgColor, textColor });
  const singleColumn = fontScale >= SINGLE_COLUMN_SCALE;

  const [annotations, setAnnotations] = useState([]);
  const [selectionInfo, setSelectionInfo] = useState(null); // { column, start, end, text, rect }
  const [editingAnn, setEditingAnn] = useState(null);        // annotation being noted/edited (private)
  const [noteDraft, setNoteDraft] = useState('');
  const [geminiText, setGeminiText] = useState(null);        // highlighted text being asked about

  // --- Room state ---
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [membersOpen, setMembersOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFeed, setChatFeed] = useState([]);
  const [chatError, setChatError] = useState(null);
  const [threadHighlight, setThreadHighlight] = useState(null);
  const [threadComments, setThreadComments] = useState([]);

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastProgressRef = useRef(null);
  const restoredRef = useRef(false);
  const pendingResumeRef = useRef(null);
  const userIdRef = useRef(user?.id);
  const threadIdRef = useRef(null);
  useEffect(() => { userIdRef.current = user?.id; }, [user]);
  useEffect(() => { threadIdRef.current = threadHighlight?.id ?? null; }, [threadHighlight]);

  // Initial load — branches on room vs private mode.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    restoredRef.current = false;
    pendingResumeRef.current = null;

    async function load() {
      try {
        if (roomMode) {
          const data = await getRoom(roomId);
          if (cancelled) return;
          if (!data.membership) {
            setError('You are not a member of this room. Join it first.');
            setLoading(false);
            return;
          }
          setRoom(data.room);
          setMembers(data.members || []);
          setMyMembership(data.membership);
          const bId = data.room.bookId;
          setBookId(bId);

          const [content, highlights, msgRes] = await Promise.all([
            fetchBookContent(bId),
            listRoomHighlights(roomId).catch(() => []),
            listRoomMessages(roomId, { limit: 50 }).catch(() => ({ messages: [] })),
          ]);
          if (cancelled) return;
          setChapters(content.chapters || []);
          setAnnotations((Array.isArray(highlights) ? highlights : []).map(normalizeRoomHighlight));
          setChatFeed(msgRes.messages || []);
          const resumeAt = Number(data.membership.lastPage);
          if (Number.isFinite(resumeAt) && resumeAt > 0) pendingResumeRef.current = resumeAt;
          else restoredRef.current = true;
        } else {
          const bId = Number(id);
          const [content, anns, historyEntry] = await Promise.all([
            fetchBookContent(bId),
            fetchAnnotations(bId).catch(() => []),
            fetchHistoryEntry({ bookId: bId }).catch(() => null),
          ]);
          if (cancelled) return;
          setChapters(content.chapters || []);
          setAnnotations(Array.isArray(anns) ? anns : []);
          const savedPage = Number(historyEntry?.current_page);
          if (Number.isFinite(savedPage) && savedPage > 0) pendingResumeRef.current = savedPage;
          else restoredRef.current = true;
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401) { navigate('/login'); return; }
        if (err?.status === 403) { setError('This room is private.'); return; }
        setError(err?.message || 'Failed to load reading content.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, roomId, roomMode, navigate]);

  const pages = useMemo(() => chaptersToPages(chapters), [chapters]);

  const queueProgress = (progress, pageIndex) => {
    if (progress === lastProgressRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      lastProgressRef.current = progress;
      if (roomMode) {
        updateProgress(roomId, pageIndex).catch(() => {});
      } else {
        saveHistory({ bookId: Number(id), progress, currentPage: pageIndex }).catch(console.error);
      }
    }, 800);
  };

  // Restore the last read page once pages have been computed.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!pages.length) return;
    const resumeAt = pendingResumeRef.current;
    if (resumeAt == null) { restoredRef.current = true; return; }
    const clamped = Math.max(0, Math.min(resumeAt, pages.length - 1));
    restoredRef.current = true;
    pendingResumeRef.current = null;
    setCurrentPage(clamped);
  }, [pages.length]);

  // Record reading progress on open (page 0) and on every page turn.
  useEffect(() => {
    if (!pages.length) return;
    if (!restoredRef.current) return;
    const denom = Math.max(1, pages.length - 1);
    const progress = Math.max(0, Math.min(100, Math.round((currentPage / denom) * 100)));
    queueProgress(progress, currentPage);
  }, [currentPage, pages.length]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  // --- Realtime (room mode only) ---
  useEffect(() => {
    if (!roomMode) return undefined;
    let channel;
    let presence;
    try {
      const echo = getEcho();
      channel = echo.private(`reading-room.${roomId}`);

      channel.listen('.highlight.added', (data) => {
        setAnnotations((prev) => (prev.some((a) => a.id === data.id) ? prev : [...prev, normalizeRoomHighlight(data)]));
      });
      channel.listen('.highlight.updated', (data) => {
        setAnnotations((prev) => prev.map((a) => (a.id === data.id ? normalizeRoomHighlight(data) : a)));
      });
      channel.listen('.highlight.deleted', (data) => {
        setAnnotations((prev) => prev.filter((a) => a.id !== data.id));
        if (threadIdRef.current === data.id) { setThreadHighlight(null); setThreadComments([]); }
      });
      channel.listen('.comment.added', (data) => {
        setAnnotations((prev) => prev.map((a) => (a.id === data.highlightId ? { ...a, commentCount: (a.commentCount || 0) + 1 } : a)));
        if (threadIdRef.current === data.highlightId) {
          setThreadComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
        }
      });
      channel.listen('.comment.deleted', (data) => {
        setAnnotations((prev) => prev.map((a) => (a.id === data.highlightId ? { ...a, commentCount: Math.max(0, (a.commentCount || 0) - 1) } : a)));
        if (threadIdRef.current === data.highlightId) {
          setThreadComments((prev) => prev.filter((c) => c.id !== data.id));
        }
      });
      channel.listen('.member.progress', (data) => {
        setMembers((prev) => prev.map((m) => (m.userId === data.userId ? { ...m, lastPage: data.page } : m)));
      });
      channel.listen('.member.joined', (data) => {
        setMembers((prev) => (prev.some((m) => m.userId === data.userId) ? prev : [...prev, data]));
      });
      channel.listen('.member.left', (data) => {
        setMembers((prev) => prev.filter((m) => m.userId !== data.userId));
      });

      // Chat events (identical names to community)
      channel.listen('.message.sent', (data) => {
        if (data.parentId) return;
        const msg = { ...data, mine: data.author?.id === userIdRef.current };
        setChatFeed((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      });
      channel.listen('.message.updated', (data) => {
        setChatFeed((prev) => prev.map((m) => (m.id === data.id ? { ...m, body: data.body, editedAt: data.editedAt } : m)));
      });
      channel.listen('.message.deleted', (data) => {
        setChatFeed((prev) => prev.filter((m) => m.id !== data.id));
      });
      channel.listen('.reaction.toggled', (data) => {
        setChatFeed((prev) => prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m)));
      });
      channel.listen('.message.spoiler', (data) => {
        setChatFeed((prev) => prev.map((m) => (m.id === data.id ? { ...m, isSpoiler: data.isSpoiler } : m)));
      });

      presence = echo.join(`reading-room.${roomId}`);
      presence
        .here((users) => setOnlineIds(new Set(users.map((u) => u.id))))
        .joining((u) => setOnlineIds((prev) => new Set(prev).add(u.id)))
        .leaving((u) => setOnlineIds((prev) => { const n = new Set(prev); n.delete(u.id); return n; }));
    } catch (e) {
      console.warn('Room realtime init failed.', e);
    }
    return () => {
      try {
        ['.highlight.added', '.highlight.updated', '.highlight.deleted', '.comment.added',
          '.comment.deleted', '.member.progress', '.member.joined', '.member.left',
          '.message.sent', '.message.updated', '.message.deleted', '.reaction.toggled',
          '.message.spoiler'].forEach((ev) => { try { channel?.stopListening(ev); } catch {} });
        getEcho().leave(`reading-room.${roomId}`);
        getEcho().leave(`presence-reading-room.${roomId}`);
      } catch {}
    };
  }, [roomMode, roomId]);

  const goToPage = (next) => {
    if (!pages.length) return;
    setSelectionInfo(null);
    setCurrentPage(Math.max(0, Math.min(next, pages.length - 1)));
  };

  const handleReaderTap = (e) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    if (window.innerWidth >= 1024) { setChromeVisible((v) => !v); return; }
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w * 0.25) goToPage(currentPage - 1);
    else if (x > w * 0.75) goToPage(currentPage + 1);
    else setChromeVisible((v) => !v);
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setSelectionInfo(null); return; }
    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    let column = null;
    let colEl = null;
    if (leftRef.current && leftRef.current.contains(ancestor)) { column = 'left'; colEl = leftRef.current; }
    else if (rightRef.current && rightRef.current.contains(ancestor)) { column = 'right'; colEl = rightRef.current; }
    else { setSelectionInfo(null); return; }

    let start = getTextOffset(colEl, range.startContainer, range.startOffset);
    let end = getTextOffset(colEl, range.endContainer, range.endOffset);
    if (start > end) [start, end] = [end, start];
    const fullText = column === 'left' ? pages[currentPage].left : pages[currentPage].right;
    const text = fullText.slice(start, end).trim();
    if (!text || end <= start) { setSelectionInfo(null); return; }
    const rect = range.getBoundingClientRect();
    setSelectionInfo({ column, start, end, text, rect });
  };

  const createHighlight = async (color, openNote = false) => {
    if (!selectionInfo) return;
    const { column, start, end, text } = selectionInfo;
    try {
      if (roomMode) {
        const created = await createRoomHighlight(roomId, {
          page_index: currentPage,
          column,
          start_offset: start,
          end_offset: end,
          selected_text: text,
          note: null,
        });
        setAnnotations((prev) => [...prev, normalizeRoomHighlight(created)]);
        window.getSelection()?.removeAllRanges();
        setSelectionInfo(null);
      } else {
        const created = await createAnnotation(Number(id), {
          page_index: currentPage,
          column,
          start_offset: start,
          end_offset: end,
          selected_text: text,
          note: null,
          color,
        });
        setAnnotations((prev) => [...prev, created]);
        window.getSelection()?.removeAllRanges();
        setSelectionInfo(null);
        if (openNote) openEditor(created);
      }
    } catch (err) {
      if (err?.status === 401) navigate('/login');
    }
  };

  // Click on a highlight: room highlights open their discussion thread; private
  // highlights open the note editor.
  const onAnnClick = (ann) => {
    if (ann?.room) openThread(ann);
    else openEditor(ann);
  };

  const openEditor = (ann) => {
    setEditingAnn(ann);
    setNoteDraft(ann.note || '');
  };

  const saveNote = async () => {
    if (!editingAnn) return;
    try {
      const updated = await updateAnnotation(editingAnn.id, { note: noteDraft });
      setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditingAnn(null);
    } catch (err) {
      if (err?.status === 401) navigate('/login');
    }
  };

  const removeAnnotation = async (annId) => {
    try {
      await deleteAnnotation(annId);
      setAnnotations((prev) => prev.filter((a) => a.id !== annId));
      if (editingAnn?.id === annId) setEditingAnn(null);
    } catch (err) {
      if (err?.status === 401) navigate('/login');
    }
  };

  // --- Room highlight thread ---
  const openThread = async (ann) => {
    setThreadHighlight(ann);
    setThreadComments([]);
    setMembersOpen(false);
    setChatOpen(false);
    try {
      const comments = await listHighlightComments(ann.id);
      setThreadComments(Array.isArray(comments) ? comments : []);
    } catch { /* ignore */ }
  };

  const handleAddComment = async (body) => {
    if (!threadHighlight) return;
    try {
      const created = await addHighlightComment(threadHighlight.id, body);
      setThreadComments((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
      setAnnotations((prev) => prev.map((a) => (a.id === threadHighlight.id ? { ...a, commentCount: (a.commentCount || 0) + 1 } : a)));
    } catch (err) { toast.error(err?.message || 'Failed to comment'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setThreadComments((prev) => prev.filter((c) => c.id !== commentId));
      if (threadHighlight) {
        setAnnotations((prev) => prev.map((a) => (a.id === threadHighlight.id ? { ...a, commentCount: Math.max(0, (a.commentCount || 0) - 1) } : a)));
      }
    } catch (err) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleDeleteRoomHighlight = async () => {
    if (!threadHighlight) return;
    try {
      await deleteRoomHighlight(threadHighlight.id);
      setAnnotations((prev) => prev.filter((a) => a.id !== threadHighlight.id));
      setThreadHighlight(null);
      setThreadComments([]);
    } catch (err) { toast.error(err?.message || 'Failed to delete highlight'); }
  };

  // --- Room chat handlers ---
  const upsertChat = (msg) => setChatFeed((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  const handleSendText = async (body, isSpoiler = false) => {
    try { upsertChat(await sendRoomText(roomId, body, isSpoiler)); } catch (e) { setChatError(e?.message || 'Failed to send'); }
  };
  const handleSendAudio = async (file, dur) => {
    try { upsertChat(await sendRoomAudio(roomId, file, dur)); } catch (e) { setChatError(e?.message || 'Failed to send audio'); }
  };
  const handleSendImage = async (file, caption, isSpoiler = false) => {
    try { upsertChat(await sendRoomImage(roomId, file, caption, isSpoiler)); } catch (e) { setChatError(e?.message || 'Failed to send image'); }
  };
  const handleReact = async (msgId, emoji) => {
    try { const { reactions } = await toggleRoomReaction(roomId, msgId, emoji); setChatFeed((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions } : m))); } catch (e) { setChatError(e?.message || 'Failed to react'); }
  };
  const handleEditMsg = async (msgId, body) => {
    try { const u = await editRoomMessage(roomId, msgId, body); setChatFeed((prev) => prev.map((m) => (m.id === msgId ? { ...m, body: u.body, editedAt: u.editedAt } : m))); } catch (e) { setChatError(e?.message || 'Failed to edit'); }
  };
  const handleDeleteMsg = async (msgId) => {
    try { await deleteRoomMessage(roomId, msgId); setChatFeed((prev) => prev.filter((m) => m.id !== msgId)); } catch (e) { setChatError(e?.message || 'Failed to delete'); }
  };

  // --- Invite ---
  const handleInvite = async () => {
    try {
      const res = await listFriends();
      const friends = res?.data || [];
      if (!friends.length) { toast.show('Add friends first to invite them.'); return; }
      const names = friends.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
      const pick = window.prompt(`Invite a friend by number:\n${names}`);
      const idx = Number(pick) - 1;
      if (Number.isInteger(idx) && friends[idx]) {
        await inviteFriend(roomId, friends[idx].id);
        toast.success(`Invited ${friends[idx].name}`);
      }
    } catch (err) { toast.error(err?.message || 'Failed to invite'); }
  };

  const copyInviteLink = () => {
    if (!room?.joinCode) return;
    const url = `${window.location.origin}/rooms/${room.id}/read`;
    navigator.clipboard?.writeText(`${url}\nInvite code: ${room.joinCode}`).then(
      () => toast.success('Invite link copied'),
      () => toast.show(`Invite code: ${room.joinCode}`),
    );
  };

  if (loading) {
    return <div className="px-6 py-6 text-sm text-gray-500"><Spinner label="Loading book…" /></div>;
  }
  if (error) {
    return <p className="px-6 py-6 text-sm text-red-600">{error}</p>;
  }
  if (!pages.length) {
    return <p className="px-6 py-6 text-sm text-gray-500">No content available.</p>;
  }

  const page = pages[currentPage];
  const leftAnns = annotations.filter((a) => a.page_index === currentPage && a.column === 'left');
  const rightAnns = annotations.filter((a) => a.page_index === currentPage && a.column === 'right');

  const closeRoomPanels = () => { setMembersOpen(false); setChatOpen(false); setThreadHighlight(null); };

  const TopIcons = () => (
    <div className="flex items-center gap-4 text-current">
      {roomMode && (
        <>
          <button
            onClick={() => { closeRoomPanels(); setMembersOpen(true); }}
            className="p-1 rounded hover:text-[#5b7c99]"
            aria-label="Room members"
            title="Members"
          >
            <Users size={22} />
          </button>
          <button
            onClick={() => { closeRoomPanels(); setChatOpen(true); }}
            className="p-1 rounded hover:text-[#5b7c99]"
            aria-label="Room chat"
            title="Chat"
          >
            <MessageCircle size={22} />
          </button>
        </>
      )}
      <button
        onClick={() => setIsAnnotationsOpen((o) => !o)}
        className={`p-1 rounded transition-colors ${isAnnotationsOpen ? 'text-[#5b7c99]' : 'hover:text-[#5b7c99]'}`}
        aria-label="Toggle annotations"
      >
        <BookMarked size={22} />
      </button>
      {!roomMode && (
        <button onClick={() => setBookmarked((b) => !b)} className="p-1 rounded hover:text-[#5b7c99]" aria-label="Bookmark">
          <Bookmark size={22} fill={bookmarked ? '#5b7c99' : 'none'} stroke={bookmarked ? '#5b7c99' : 'currentColor'} />
        </button>
      )}
      <button
        onClick={() => setIsSettingsOpen((o) => !o)}
        className={`p-1 rounded transition-colors ${isSettingsOpen ? 'text-[#5b7c99]' : 'hover:text-[#5b7c99]'}`}
        aria-label="Reading settings"
      >
        <Settings2 size={22} />
      </button>
    </div>
  );

  return (
    <div
      className="flex h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6"
      style={{ backgroundColor: bg, color: text }}
    >
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`${chromeVisible ? 'grid' : 'hidden'} lg:grid grid-cols-3 items-center px-4 sm:px-8 py-3 sm:py-5`}>
          <button
            onClick={() => navigate(roomMode ? '/rooms' : -1)}
            className="inline-flex items-center gap-1 text-sm text-current hover:text-[#5b7c99] justify-self-start"
          >
            <ChevronLeft size={18} /> <span className="hidden sm:inline">{roomMode ? 'Rooms' : 'Back'}</span>
          </button>

          <div className="text-center min-w-0 px-2">
            {roomMode && <h2 className="text-sm font-semibold text-current truncate">{room?.name}</h2>}
            <h3 className="hidden sm:block text-base font-semibold text-current truncate">
              {roomMode ? page.chapterTitle : `Chapter ${page.chapter}`}
            </h3>
            {!roomMode && <h3 className="block sm:hidden text-sm font-semibold text-current truncate">Chapter {page.chapter}</h3>}
          </div>

          <div className="justify-self-end">
            <TopIcons />
          </div>
        </header>

        <main className="relative flex-1 flex items-center px-2 sm:px-8 lg:px-12 py-3 sm:py-6 overflow-hidden">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 0}
            className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>

          <div
            key={currentPage}
            onMouseUp={handleMouseUp}
            onClick={handleReaderTap}
            className={`flex-1 ${singleColumn ? 'max-w-2xl' : 'max-w-4xl'} mx-auto grid grid-cols-1 ${singleColumn ? '' : 'lg:grid-cols-2'} gap-6 lg:gap-12 h-full overflow-y-auto px-2 sm:px-4 animate-page-turn`}
          >
            <div>
              <p ref={leftRef} className="whitespace-pre-line text-justify text-current" style={{ fontSize: `${15 * fontScale}px`, lineHeight: 1.8 }}>
                {renderWithHighlights(page.left, leftAnns, onAnnClick)}
              </p>
            </div>
            <div>
              <p ref={rightRef} className="whitespace-pre-line text-justify text-current" style={{ fontSize: `${15 * fontScale}px`, lineHeight: 1.8 }}>
                {renderWithHighlights(page.right, rightAnns, onAnnClick)}
              </p>
            </div>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages.length - 1}
            className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>

          <AnnotationToolbar
            rect={selectionInfo?.rect}
            onColor={(c) => createHighlight(c)}
            onNote={(c) => createHighlight(c, true)}
            onAskGemini={() => {
              setGeminiText(selectionInfo.text);
              window.getSelection()?.removeAllRanges();
              setSelectionInfo(null);
            }}
          />
        </main>

        <footer className={`${chromeVisible ? 'flex' : 'hidden'} lg:flex items-center justify-center gap-6 py-3 sm:py-4 text-sm font-semibold text-current`}>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 0} className="lg:hidden p-1 text-current hover:text-[#5b7c99] disabled:opacity-30" aria-label="Previous page">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <span>{currentPage + 1}/{pages.length}</span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pages.length - 1} className="lg:hidden p-1 text-current hover:text-[#5b7c99] disabled:opacity-30" aria-label="Next page">
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        </footer>
      </div>

      <ReaderSettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <GeminiAskPanel
        isOpen={!!geminiText}
        selectedText={geminiText}
        bookTitle={page.chapterTitle}
        onClose={() => setGeminiText(null)}
      />

      {/* Room members panel */}
      {roomMode && membersOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMembersOpen(false)} aria-hidden />
          <RoomMembersPanel
            members={members}
            onlineIds={onlineIds}
            currentUserId={user?.id}
            onJumpTo={(p) => goToPage(p)}
            onInvite={room?.joinCode ? copyInviteLink : handleInvite}
            onClose={() => setMembersOpen(false)}
          />
        </>
      )}

      {/* Room chat panel */}
      {roomMode && chatOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setChatOpen(false)} aria-hidden />
          <RoomChatPanel
            feed={chatFeed}
            onSendText={handleSendText}
            onSendAudio={handleSendAudio}
            onSendImage={handleSendImage}
            onReact={handleReact}
            onEdit={handleEditMsg}
            onDelete={handleDeleteMsg}
            onClose={() => setChatOpen(false)}
            error={chatError}
          />
        </>
      )}

      {/* Room highlight discussion thread */}
      {roomMode && threadHighlight && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setThreadHighlight(null)} aria-hidden />
          <HighlightThread
            highlight={threadHighlight}
            comments={threadComments}
            currentUserId={user?.id}
            isOwner={room?.isOwner}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onDeleteHighlight={handleDeleteRoomHighlight}
            onClose={() => setThreadHighlight(null)}
          />
        </>
      )}

      {isAnnotationsOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setIsAnnotationsOpen(false)} aria-hidden />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#b8c5d6] flex flex-col shadow-xl lg:static lg:z-auto lg:w-72 lg:max-w-none lg:shadow-none">
            <div className="flex items-center justify-end px-6 py-5 text-[#2c3e50]">
              <button onClick={() => setIsAnnotationsOpen(false)} className="p-1 hover:text-[#5b7c99]" aria-label="Close annotations">
                <X size={22} />
              </button>
            </div>

            <h3 className="text-center text-lg font-semibold text-[#2c3e50] mb-4">{roomMode ? 'Shared highlights' : 'Annotations'}</h3>

            <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
              {annotations.length === 0 && (
                <p className="px-2 text-[13px] text-[#2c3e50]/70 text-center">
                  Select text on any page and highlight it to start annotating.
                </p>
              )}
              {[...annotations]
                .sort((a, b) => a.page_index - b.page_index || a.start_offset - b.start_offset)
                .map((a) => (
                  <div key={a.id} className="group rounded-md bg-white/40 p-2 hover:bg-white/70 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => { goToPage(a.page_index); if (a.room) openThread(a); }} className="flex-1 text-left">
                        <span className="block text-[11px] font-semibold text-[#5b7c99]">
                          Page {a.page_index + 1}{a.room && a.author?.name ? ` · ${a.author.name}` : ''}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-[#2c3e50] leading-snug border-l-2 pl-2" style={{ borderColor: a.color || DEFAULT_COLOR }}>
                          “{a.selected_text.length > 90 ? `${a.selected_text.slice(0, 90)}…` : a.selected_text}”
                        </span>
                        {a.note && <span className="mt-1 block text-[12px] italic text-[#2c3e50]/70">{a.note}</span>}
                        {a.room && (a.commentCount > 0) && (
                          <span className="mt-1 inline-block text-[11px] text-[#5b7c99]">{a.commentCount} comment{a.commentCount === 1 ? '' : 's'}</span>
                        )}
                      </button>
                      {!roomMode && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditor(a)} className="p-1 text-[#2c3e50] hover:text-[#5b7c99]" aria-label="Edit note"><Edit3 size={15} /></button>
                          <button onClick={() => removeAnnotation(a.id)} className="p-1 text-[#2c3e50] hover:text-red-600" aria-label="Delete annotation"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </aside>
        </>
      )}

      {editingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-[#2c3e50]">Note</h4>
              <button onClick={() => setEditingAnn(null)} className="p-1 text-[#2c3e50] hover:text-[#5b7c99]" aria-label="Close note editor"><X size={18} /></button>
            </div>
            <p className="mt-3 rounded-md border-l-2 bg-[#f8f6f2] p-2 text-[13px] text-[#2c3e50] leading-snug" style={{ borderColor: editingAnn.color || DEFAULT_COLOR }}>
              “{editingAnn.selected_text}”
            </p>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Write your note…"
              rows={4}
              className="mt-3 w-full resize-none rounded-md border border-gray-300 p-2 text-[13px] text-[#2c3e50] focus:border-[#5b7c99] focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => removeAnnotation(editingAnn.id)} className="inline-flex items-center gap-1 text-[13px] text-red-600 hover:text-red-700">
                <Trash2 size={15} /> Delete
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingAnn(null)} className="rounded-md px-3 py-1.5 text-[13px] text-[#2c3e50] hover:bg-[#f0ece3]">Cancel</button>
                <button onClick={saveNote} className="rounded-md bg-[#5b7c99] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#4a6884]">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPage;
