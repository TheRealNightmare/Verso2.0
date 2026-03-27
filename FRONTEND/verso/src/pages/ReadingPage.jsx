import React, { useState } from 'react'; // Add useState
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, Book, Edit3 } from 'lucide-react';

const ReadingPage = () => {
  const navigate = useNavigate();
  // State to toggle the blue sidebar
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);

  return (
    <div className="reading-layout-wrapper">
      <div className={`reading-page ${isAnnotationsOpen ? 'with-sidebar' : ''}`}>
        <header className="reading-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} /> Back
          </button>
          <div className="chapter-info">
            <h3>Chapter 1</h3>
            <h2>Lorem Ipsum Dolor</h2>
          </div>
          <div className="reading-tools">
            {/* Click this icon to toggle the blue page */}
            <Book 
               size={24} 
               className={isAnnotationsOpen ? 'tool-active' : ''} 
               onClick={() => setIsAnnotationsOpen(!isAnnotationsOpen)} 
               style={{ cursor: 'pointer' }}
            />
            <Bookmark size={24} />
            <Edit3 size={24} />
          </div>
        </header>

        <main className="book-content">
          <button className="nav-arrow left"><ChevronLeft size={30} /></button>
          <div className="dual-column-text">
            <div className="column">
              <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem...</p>
              <p>totam rem aperiam, eaque ipsa quae ab illo inventore...</p>
            </div>
            <div className="column">
              <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem...</p>
              <p>totam rem aperiam, eaque ipsa quae ab illo inventore...</p>
            </div>
          </div>
          <button className="nav-arrow right"><ChevronRight size={30} /></button>
        </main>

        <footer className="reading-footer">
          <span>1/10</span>
        </footer>
      </div>

      {/* The Blue Annotations Sidebar */}
      {isAnnotationsOpen && (
        <aside className="annotations-sidebar">
          <div className="sidebar-icons-top">
             <Book size={24} />
             <Bookmark size={24} />
             <Edit3 size={24} />
          </div>
          <h3 className="sidebar-title">Annotations</h3>
          <div className="annotations-list">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <div key={num} className="annotation-item">
                Chapter {num}: Lorem Ipsum Dolor Totum
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default ReadingPage;