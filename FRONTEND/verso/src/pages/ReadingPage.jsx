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
        setPages(splitPages(data.content || ''));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const saveProgress = useCallback((page, total) => {
    if (!total) return;
    const progress = Math.round(((page + 1) / total) * 100);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveHistory(id, progress).catch(() => {});
    }, 1000);
  }, [id]);

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

  if (loading) return <p style={{ padding: '2rem', color: '#aaa' }}>Loading book...</p>;

  const pageText = pages[currentPage] || '';
  const half = Math.ceil(pageText.length / 2);

  return (
    <div className="reading-layout-wrapper">
      <div className={`reading-page ${isAnnotationsOpen ? 'with-sidebar' : ''}`}>
        <header className="reading-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Back
          </button>

          <div className="chapter-info">
            <h3>{bookData?.author}</h3>
            <h2>{bookData?.title}</h2>
          </div>

          <div className="reading-tools">
            <Book
              size={24}
              className={isAnnotationsOpen ? 'tool-active' : ''}
              onClick={() => setIsAnnotationsOpen(!isAnnotationsOpen)}
              style={{ cursor: 'pointer' }}
            />
            <Bookmark
              size={24}
              fill={bookmarked ? '#5b7c99' : 'none'}
              stroke={bookmarked ? '#5b7c99' : 'currentColor'}
              onClick={handleSaveClick}
              style={{ cursor: 'pointer' }}
            />
            <Edit3 size={24} />
          </div>
        </header>

        <main className="book-content">
          <button className="nav-arrow left" onClick={() => goToPage(currentPage - 1)}>
            <ChevronLeft size={30} />
          </button>

          <div className="dual-column-text">
            <div className="column">
              <p style={{ whiteSpace: 'pre-wrap' }}>{pageText.slice(0, half)}</p>
            </div>
            <div className="column">
              <p style={{ whiteSpace: 'pre-wrap' }}>{pageText.slice(half)}</p>
            </div>
          </div>

          <button className="nav-arrow right" onClick={() => goToPage(currentPage + 1)}>
            <ChevronRight size={30} />
          </button>
        </main>

        <footer className="reading-footer">
          <span>{currentPage + 1}/{pages.length}</span>
        </footer>
      </div>

      {isAnnotationsOpen && (
        <aside className="annotations-sidebar">
          <div className="sidebar-icons-top">
            <Book size={24} onClick={() => setIsAnnotationsOpen(false)} style={{ cursor: 'pointer' }} />
            <Bookmark
              size={24}
              fill={bookmarked ? '#5b7c99' : 'none'}
              onClick={handleSaveClick}
              style={{ cursor: 'pointer' }}
            />
            <Edit3 size={24} />
          </div>

          <h3 className="sidebar-title">Annotations</h3>

          <div className="annotations-list">
            <div className="annotation-item">Progress: {Math.round(((currentPage + 1) / pages.length) * 100)}%</div>
            <div className="annotation-item">Page {currentPage + 1} of {pages.length}</div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default ReadingPage;
