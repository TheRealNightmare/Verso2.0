import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, Book, Edit3 } from 'lucide-react';

const ReadingPage = () => {
  const navigate = useNavigate();
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false);

  // New function to handle storage navigation
  const handleSaveClick = () => {
    navigate('/storage');
  };

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
            <Book 
               size={24} 
               className={isAnnotationsOpen ? 'tool-active' : ''} 
               onClick={() => setIsAnnotationsOpen(!isAnnotationsOpen)} 
               style={{ cursor: 'pointer' }}
            />
            {/* Added onClick here */}
            <Bookmark 
              size={24} 
              onClick={handleSaveClick} 
              style={{ cursor: 'pointer' }} 
            />
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
             <Book 
               size={24} 
               onClick={() => setIsAnnotationsOpen(false)} 
               style={{ cursor: 'pointer' }}
             />
             {/* Also added onClick to the bookmark inside the sidebar */}
             <Bookmark 
               size={24} 
               onClick={handleSaveClick} 
               style={{ cursor: 'pointer' }} 
             />
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