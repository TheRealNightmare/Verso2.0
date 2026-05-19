import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, BookMarked, Edit3 } from 'lucide-react';
import { fetchBookContent } from '../api/content';

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

const ReadingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBookContent(id)
      .then((data) => {
        if (cancelled) return;
        setChapters(data.chapters || []);
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
  const annotations = useMemo(
    () =>
      (chapters || []).map((c) => ({
        id: `ch-${c.number}`,
        chapter: c.number,
        title: c.title,
      })),
    [chapters],
  );

  const firstPageIndexForChapter = (chapterNumber) =>
    Math.max(0, pages.findIndex((p) => p.chapter === chapterNumber));

  const goToPage = (next) => {
    if (!pages.length) return;
    setCurrentPage(Math.max(0, Math.min(next, pages.length - 1)));
  };

  if (loading) {
    return <p className="px-6 py-6 text-sm text-gray-500">Loading book...</p>;
  }
  if (error) {
    return <p className="px-6 py-6 text-sm text-red-600">{error}</p>;
  }
  if (!pages.length) {
    return <p className="px-6 py-6 text-sm text-gray-500">No content available.</p>;
  }

  const page = pages[currentPage];

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
      <button className="p-1 rounded hover:text-[#5b7c99]" aria-label="Edit annotation">
        <Edit3 size={22} />
      </button>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3rem)] -m-6 bg-[#f8f6f2]">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="grid grid-cols-3 items-center px-8 py-5 bg-[#f8f6f2]">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-[#2c3e50] hover:text-[#5b7c99] justify-self-start"
          >
            <ChevronLeft size={18} /> Back
          </button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-[#2c3e50]">Chapter {page.chapter}</h2>
            <h3 className="text-lg font-semibold text-[#2c3e50]">{page.chapterTitle}</h3>
          </div>

          <div className="justify-self-end">
            <TopIcons onAnnotations={() => setIsAnnotationsOpen((o) => !o)} />
          </div>
        </header>

        <main className="relative flex-1 flex items-center px-16 py-6 overflow-hidden bg-[#f8f6f2]">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>

          <div
            key={currentPage}
            className="flex-1 grid grid-cols-2 gap-16 h-full overflow-y-auto px-4 animate-page-turn"
          >
            <div>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#2c3e50]/80">
                {page.left}
              </p>
            </div>
            <div>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#2c3e50]/80">
                {page.right}
              </p>
            </div>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>
        </main>

        <footer className="flex items-center justify-center py-4 text-sm font-semibold text-[#2c3e50] bg-[#f8f6f2]">
          {currentPage + 1}/{pages.length}
        </footer>
      </div>

      {isAnnotationsOpen && (
        <aside className="w-72 bg-[#b8c5d6] flex flex-col">
          <div className="flex items-center justify-end gap-4 px-6 py-5 text-[#2c3e50]">
            <button
              onClick={() => setIsAnnotationsOpen(false)}
              className="p-1 text-[#5b7c99]"
              aria-label="Close annotations"
            >
              <BookMarked size={22} />
            </button>
            <button onClick={() => setBookmarked((b) => !b)} className="p-1" aria-label="Bookmark">
              <Bookmark
                size={22}
                fill={bookmarked ? '#2c3e50' : 'none'}
                stroke="#2c3e50"
              />
            </button>
            <button className="p-1" aria-label="Edit annotation">
              <Edit3 size={22} />
            </button>
          </div>

          <h3 className="text-center text-lg font-semibold text-[#2c3e50] mb-4">Annotations</h3>

          <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
            {annotations.map((a) => (
              <button
                key={a.id}
                onClick={() => goToPage(firstPageIndexForChapter(a.chapter))}
                className="text-left text-[13px] text-[#2c3e50] hover:text-[#5b7c99] leading-snug"
              >
                {a.title}
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default ReadingPage;
