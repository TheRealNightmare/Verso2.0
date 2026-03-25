import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, Book, Edit3 } from 'lucide-react';

const ReadingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="reading-page">
      <header className="reading-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> Back
        </button>
        <div className="chapter-info">
          <h3>Chapter 1</h3>
          <h2>Lorem Ipsum Dolor</h2>
        </div>
        <div className="reading-tools">
          <Book size={20} />
          <Bookmark size={20} />
          <Edit3 size={20} />
        </div>
      </header>

      <main className="book-content">
        <button className="nav-arrow left"><ChevronLeft size={30} /></button>
        
        <div className="dual-column-text">
          <div className="column">
            <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium...</p>
            <p>totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo...</p>
          </div>
          <div className="column">
            <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium...</p>
            <p>totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo...</p>
          </div>
        </div>

        <button className="nav-arrow right"><ChevronRight size={30} /></button>
      </main>

      <footer className="reading-footer">
        <span>1/10</span>
      </footer>
    </div>
  );
};

export default ReadingPage;