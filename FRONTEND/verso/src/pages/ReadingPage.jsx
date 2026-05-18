import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, Book, Edit3 } from 'lucide-react';
import { fetchBookContent } from '../api/content';
import { saveHistory } from '../api/history';
import { addBookmark, removeBookmark } from '../api/bookmarks';

const PAGE_SIZE = 3000;

function splitPages(text) {
  const pages = [];
  for (let i = 0; i < text.length; i += PAGE_SIZE) {
    pages.push(text.slice(i, i + PAGE_SIZE));
  }
  return pages.length ? pages : [''];
}

const ReadingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookData, setBookData] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    fetchBookContent(id)
      .then((data) => {
        setBookData(data);
        const pgs = splitPages(data.content || '');
        setPages(pgs);
        saveHistory(id, Math.round((1 / (pgs.length || 1)) * 100)).catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const saveProgress = useCallback(
    (page, total) => {
      if (!total) return;
      const progress = Math.round(((page + 1) / total) * 100);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveHistory(id, progress).catch(() => {});
      }, 1000);
    },
    [id]
  );

  const goToPage = (next) => {
    const clamped = Math.max(0, Math.min(next, pages.length - 1));
    setCurrentPage(clamped);
    saveProgress(clamped, pages.length);
  };

  const handleSaveClick = async () => {
    try {
      if (bookmarked) {
        await removeBookmark(id);
        setBookmarked(false);
      } else {
        await addBookmark(id);
        setBookmarked(true);
      }
    } catch (err) {
      if (err.status === 401) navigate('/login');
    }
  };

  if (loading) return <p className="p-8 text-slate-400">Loading book...</p>;

  const pageText = pages[currentPage] || '';
  const half = Math.ceil(pageText.length / 2);

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 flex flex-col bg-[#f8f6f2] min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#5b7c99]"
          >
            <ChevronLeft size={20} /> Back
          </button>

          <div className="text-center">
            <h3 className="text-xs uppercase tracking-wide text-slate-400">{bookData?.author}</h3>
            <h2 className="text-base font-semibold text-slate-800">{bookData?.title}</h2>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <Book
              size={22}
              className={`cursor-pointer ${isAnnotationsOpen ? 'text-[#5b7c99]' : ''}`}
              onClick={() => setIsAnnotationsOpen(!isAnnotationsOpen)}
            />
            <Bookmark
              size={22}
              fill={bookmarked ? '#5b7c99' : 'none'}
              stroke={bookmarked ? '#5b7c99' : 'currentColor'}
              onClick={handleSaveClick}
              className="cursor-pointer"
            />
            <Edit3 size={22} />
          </div>
        </header>

        <main className="relative flex-1 flex items-stretch px-16 py-8 overflow-hidden">
          <button
            onClick={() => goToPage(currentPage - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow hover:bg-slate-50"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="flex-1 grid grid-cols-2 gap-10 overflow-y-auto">
            <div>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {pageText.slice(0, half)}
              </p>
            </div>
            <div>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {pageText.slice(half)}
              </p>
            </div>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow hover:bg-slate-50"
          >
            <ChevronRight size={28} />
          </button>
        </main>

        <footer className="flex items-center justify-center px-6 py-3 border-t border-slate-200 bg-white text-sm text-slate-500">
          <span>
            {currentPage + 1}/{pages.length}
          </span>
        </footer>
      </div>

      {isAnnotationsOpen && (
        <aside className="w-80 border-l border-slate-200 bg-white p-5 flex flex-col">
          <div className="flex items-center gap-3 text-slate-600 mb-6">
            <Book
              size={22}
              onClick={() => setIsAnnotationsOpen(false)}
              className="cursor-pointer"
            />
            <Bookmark
              size={22}
              fill={bookmarked ? '#5b7c99' : 'none'}
              onClick={handleSaveClick}
              className="cursor-pointer"
            />
            <Edit3 size={22} />
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-3">Annotations</h3>

          <div className="flex flex-col gap-2">
            <div className="p-3 rounded-lg bg-slate-50 text-sm text-slate-700">
              Progress: {Math.round(((currentPage + 1) / pages.length) * 100)}%
            </div>
            <div className="p-3 rounded-lg bg-slate-50 text-sm text-slate-700">
              Page {currentPage + 1} of {pages.length}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default ReadingPage;
