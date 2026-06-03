import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, BookMarked, Edit3, Trash2, X } from 'lucide-react';
import { fetchBookContent } from '../api/content';
import { saveHistory, fetchHistoryEntry } from '../api/history';
import {
  fetchAnnotations,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from '../api/annotations';
import Spinner from '../components/ui/Spinner';
import usePageTitle from '../hooks/usePageTitle';
import useReadingSession from '../hooks/useReadingSession';

const CHARS_PER_PAGE = 1800;

const HIGHLIGHT_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];
const DEFAULT_COLOR = HIGHLIGHT_COLORS[0];

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

// Character offset of a selection boundary within an element's text content.
// Robust even when the element already contains <mark> elements (multiple text nodes).
function getTextOffset(rootEl, node, offsetInNode) {
  if (!rootEl || !node) return 0;
  const range = document.createRange();
  range.selectNodeContents(rootEl);
  try {
    range.setEnd(node, offsetInNode);
  } catch {
    return 0;
  }
  return range.toString().length;
}

// Split a column's text into plain strings + <mark> spans for its annotations.
function renderWithHighlights(text, anns, onClickAnn) {
  if (!anns.length) return text;
  const sorted = [...anns].sort((a, b) => a.start_offset - b.start_offset);
  const out = [];
  let cursor = 0;
  sorted.forEach((a) => {
    const s = Math.max(cursor, a.start_offset);
    const e = Math.min(text.length, a.end_offset);
    if (s > cursor) out.push(text.slice(cursor, s));
    if (e > s) {
      out.push(
        <mark
          key={a.id}
          onClick={() => onClickAnn(a)}
          title={a.note || 'Click to add a note'}
          className="cursor-pointer rounded-sm"
          style={{ backgroundColor: a.color || DEFAULT_COLOR, color: 'inherit' }}
        >
          {text.slice(s, e)}
        </mark>,
      );
      cursor = e;
    }
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

const ReadingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Track time spent reading this book so the dashboard can report it.
  useReadingSession({ bookId: Number(id) });

  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  usePageTitle('Reading');
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true); // mobile: toggle header/footer

  const [annotations, setAnnotations] = useState([]);
  const [selectionInfo, setSelectionInfo] = useState(null); // { column, start, end, text, rect }
  const [editingAnn, setEditingAnn] = useState(null);        // annotation being noted/edited
  const [noteDraft, setNoteDraft] = useState('');

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastProgressRef = useRef(null);
  const restoredRef = useRef(false);
  const pendingResumeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    restoredRef.current = false;
    pendingResumeRef.current = null;
    Promise.all([
      fetchBookContent(id),
      fetchAnnotations(id).catch(() => []),
      fetchHistoryEntry({ bookId: Number(id) }).catch(() => null),
    ])
      .then(([content, anns, historyEntry]) => {
        if (cancelled) return;
        setChapters(content.chapters || []);
        setAnnotations(Array.isArray(anns) ? anns : []);
        const savedPage = Number(historyEntry?.current_page);
        if (Number.isFinite(savedPage) && savedPage > 0) {
          pendingResumeRef.current = savedPage;
        } else {
          restoredRef.current = true;
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 401) {
          navigate('/login');
          return;
        }
        setError(err?.message || 'Failed to load reading content.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, navigate]);

  const pages = useMemo(() => chaptersToPages(chapters), [chapters]);

  const queueProgress = (progress, pageIndex) => {
    if (progress === lastProgressRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      lastProgressRef.current = progress;
      saveHistory({ bookId: Number(id), progress, currentPage: pageIndex }).catch(console.error);
    }, 800);
  };

  // Restore the last read page once pages have been computed.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!pages.length) return;
    const resumeAt = pendingResumeRef.current;
    if (resumeAt == null) {
      restoredRef.current = true;
      return;
    }
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
    const progress = Math.max(
      0,
      Math.min(100, Math.round((currentPage / denom) * 100)),
    );
    queueProgress(progress, currentPage);
  }, [currentPage, pages.length]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const goToPage = (next) => {
    if (!pages.length) return;
    setSelectionInfo(null);
    setCurrentPage(Math.max(0, Math.min(next, pages.length - 1)));
  };

  // E-reader tap zones (phones/tablets): left 25% = previous page, right 25% =
  // next page, center = toggle the chrome. On desktop a tap just toggles chrome.
  const handleReaderTap = (e) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return; // a text selection is in progress
    if (window.innerWidth >= 1024) {
      setChromeVisible((v) => !v);
      return;
    }
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w * 0.25) goToPage(currentPage - 1);
    else if (x > w * 0.75) goToPage(currentPage + 1);
    else setChromeVisible((v) => !v);
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionInfo(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    let column = null;
    let colEl = null;
    if (leftRef.current && leftRef.current.contains(ancestor)) {
      column = 'left';
      colEl = leftRef.current;
    } else if (rightRef.current && rightRef.current.contains(ancestor)) {
      column = 'right';
      colEl = rightRef.current;
    } else {
      setSelectionInfo(null);
      return;
    }

    let start = getTextOffset(colEl, range.startContainer, range.startOffset);
    let end = getTextOffset(colEl, range.endContainer, range.endOffset);
    if (start > end) [start, end] = [end, start];
    const fullText = column === 'left' ? pages[currentPage].left : pages[currentPage].right;
    const text = fullText.slice(start, end).trim();
    if (!text || end <= start) {
      setSelectionInfo(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setSelectionInfo({ column, start, end, text, rect });
  };

  const createHighlight = async (color, openNote = false) => {
    if (!selectionInfo) return;
    const { column, start, end, text } = selectionInfo;
    try {
      const created = await createAnnotation(id, {
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
    } catch (err) {
      if (err?.status === 401) navigate('/login');
    }
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

  if (loading) {
    return (
      <div className="px-6 py-6 text-sm text-gray-500">
        <Spinner label="Loading book…" />
      </div>
    );
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

  const TopIcons = ({ onAnnotations }) => (
    <div className="flex items-center gap-4 text-[#2c3e50]">
      <button
        onClick={onAnnotations}
        className={`p-1 rounded transition-colors ${
          isAnnotationsOpen ? 'text-[#5b7c99]' : 'hover:text-[#5b7c99]'
        }`}
        aria-label="Toggle annotations"
      >
        <BookMarked size={22} />
      </button>
      <button
        onClick={() => setBookmarked((b) => !b)}
        className="p-1 rounded hover:text-[#5b7c99]"
        aria-label="Bookmark"
      >
        <Bookmark
          size={22}
          fill={bookmarked ? '#5b7c99' : 'none'}
          stroke={bookmarked ? '#5b7c99' : 'currentColor'}
        />
      </button>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6 bg-[#f8f6f2]">
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`${chromeVisible ? 'grid' : 'hidden'} lg:grid grid-cols-3 items-center px-4 sm:px-8 py-3 sm:py-5 bg-[#f8f6f2]`}>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-[#2c3e50] hover:text-[#5b7c99] justify-self-start"
          >
            <ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span>
          </button>

          <div className="text-center min-w-0 px-2">
            <h2 className="text-sm sm:text-lg font-semibold text-[#2c3e50] truncate">Chapter {page.chapter}</h2>
            <h3 className="hidden sm:block text-lg font-semibold text-[#2c3e50] truncate">{page.chapterTitle}</h3>
          </div>

          <div className="justify-self-end">
            <TopIcons onAnnotations={() => setIsAnnotationsOpen((o) => !o)} />
          </div>
        </header>

        <main className="relative flex-1 flex items-center px-2 sm:px-8 lg:px-12 py-3 sm:py-6 overflow-hidden bg-[#f8f6f2]">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 0}
            className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>

          <div
            key={currentPage}
            onMouseUp={handleMouseUp}
            onClick={handleReaderTap}
            className="flex-1 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 h-full overflow-y-auto px-2 sm:px-4 animate-page-turn"
          >
            <div>
              <p
                ref={leftRef}
                className="whitespace-pre-line text-justify text-[15px] leading-7 sm:text-[13px] sm:leading-relaxed text-[#2c3e50]/80"
              >
                {renderWithHighlights(page.left, leftAnns, openEditor)}
              </p>
            </div>
            <div>
              <p
                ref={rightRef}
                className="whitespace-pre-line text-justify text-[15px] leading-7 sm:text-[13px] sm:leading-relaxed text-[#2c3e50]/80"
              >
                {renderWithHighlights(page.right, rightAnns, openEditor)}
              </p>
            </div>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages.length - 1}
            className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>

          {selectionInfo && (
            <div
              className="fixed z-50 flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 shadow-lg ring-1 ring-black/10"
              style={{
                top: Math.max(8, selectionInfo.rect.top - 46),
                left: Math.max(8, Math.min(selectionInfo.rect.left, window.innerWidth - 220)),
              }}
            >
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => createHighlight(c)}
                  className="h-5 w-5 rounded-full ring-1 ring-black/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  aria-label={`Highlight ${c}`}
                />
              ))}
              <button
                onClick={() => createHighlight(DEFAULT_COLOR, true)}
                className="ml-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-[#2c3e50] hover:bg-[#f0ece3]"
              >
                <Edit3 size={13} /> Note
              </button>
            </div>
          )}
        </main>

        <footer className={`${chromeVisible ? 'flex' : 'hidden'} lg:flex items-center justify-center gap-6 py-3 sm:py-4 text-sm font-semibold text-[#2c3e50] bg-[#f8f6f2]`}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 0}
            className="lg:hidden p-1 text-[#2c3e50] hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <span>{currentPage + 1}/{pages.length}</span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages.length - 1}
            className="lg:hidden p-1 text-[#2c3e50] hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        </footer>
      </div>

      {isAnnotationsOpen && (
        <>
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setIsAnnotationsOpen(false)}
          aria-hidden
        />
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#b8c5d6] flex flex-col shadow-xl lg:static lg:z-auto lg:w-72 lg:max-w-none lg:shadow-none">
          <div className="flex items-center justify-end px-6 py-5 text-[#2c3e50]">
            <button
              onClick={() => setIsAnnotationsOpen(false)}
              className="p-1 hover:text-[#5b7c99]"
              aria-label="Close annotations"
            >
              <X size={22} />
            </button>
          </div>

          <h3 className="text-center text-lg font-semibold text-[#2c3e50] mb-4">Annotations</h3>

          <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
            {annotations.length === 0 && (
              <p className="px-2 text-[13px] text-[#2c3e50]/70 text-center">
                Select text on any page and highlight it to start annotating.
              </p>
            )}
            {[...annotations]
              .sort((a, b) => a.page_index - b.page_index || a.start_offset - b.start_offset)
              .map((a) => (
                <div
                  key={a.id}
                  className="group rounded-md bg-white/40 p-2 hover:bg-white/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => goToPage(a.page_index)}
                      className="flex-1 text-left"
                    >
                      <span className="block text-[11px] font-semibold text-[#5b7c99]">
                        Page {a.page_index + 1}
                      </span>
                      <span
                        className="mt-0.5 block text-[13px] text-[#2c3e50] leading-snug border-l-2 pl-2"
                        style={{ borderColor: a.color || DEFAULT_COLOR }}
                      >
                        “{a.selected_text.length > 90
                          ? `${a.selected_text.slice(0, 90)}…`
                          : a.selected_text}”
                      </span>
                      {a.note && (
                        <span className="mt-1 block text-[12px] italic text-[#2c3e50]/70">
                          {a.note}
                        </span>
                      )}
                    </button>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditor(a)}
                        className="p-1 text-[#2c3e50] hover:text-[#5b7c99]"
                        aria-label="Edit note"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => removeAnnotation(a.id)}
                        className="p-1 text-[#2c3e50] hover:text-red-600"
                        aria-label="Delete annotation"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
              <button
                onClick={() => setEditingAnn(null)}
                className="p-1 text-[#2c3e50] hover:text-[#5b7c99]"
                aria-label="Close note editor"
              >
                <X size={18} />
              </button>
            </div>
            <p
              className="mt-3 rounded-md border-l-2 bg-[#f8f6f2] p-2 text-[13px] text-[#2c3e50] leading-snug"
              style={{ borderColor: editingAnn.color || DEFAULT_COLOR }}
            >
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
              <button
                onClick={() => removeAnnotation(editingAnn.id)}
                className="inline-flex items-center gap-1 text-[13px] text-red-600 hover:text-red-700"
              >
                <Trash2 size={15} /> Delete
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingAnn(null)}
                  className="rounded-md px-3 py-1.5 text-[13px] text-[#2c3e50] hover:bg-[#f0ece3]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  className="rounded-md bg-[#5b7c99] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#4a6884]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPage;
