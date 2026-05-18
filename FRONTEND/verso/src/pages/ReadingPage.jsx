import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, BookMarked, Edit3 } from 'lucide-react';
import { mockReadingBook, mockAnnotations } from '../mocks/reading';

const ReadingPage = () => {
  const navigate = useNavigate();
  const book = mockReadingBook;
  const pages = book?.pages ?? [];

  const [currentPage, setCurrentPage] = useState(0);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const goToPage = (next) => {
    if (!pages.length) return;
    setCurrentPage(Math.max(0, Math.min(next, pages.length - 1)));
  };

  const page = pages[currentPage] ?? {
    chapter: 1,
    chapterTitle: '',
    left: '',
    right: '',
  };

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
            {mockAnnotations.map((a) => (
              <button
                key={a.id}
                onClick={() => goToPage(a.chapter - 1)}
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
