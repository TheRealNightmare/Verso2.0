import React, { useState } from 'react';
import { X } from 'lucide-react';
import ReviewComponent from '../components/ReviewComponent';
import BookInfoStats from '../components/BookInfoStats';

const History = () => {
  // Initialize state with your book data
  const [historyBooks, setHistoryBooks] = useState([
    { id: 1, title: "DANH NHAN VAT LY", author: "Lorem", genre: "Romance", producer: "Updating", status: "25/50", date: "8/18/13 06:13 PM", type: "Read", cover: "https://via.placeholder.com/120x180" },
    { id: 2, title: "Treasure Island", author: "Lorem", genre: "Romance", producer: "Updating", status: "25/50", date: "8/16/13 06:13 PM", type: "Save", cover: "https://via.placeholder.com/120x180" },
    { id: 3, title: "THE SUN ALSO RISES", author: "Lorem", genre: "Romance", producer: "Updating", status: "25/50", date: "8/15/13 06:13 PM", type: "Favourite", cover: "https://via.placeholder.com/120x180" },
  ]);

  // Function to remove a book from the list
  const removeBook = (id) => {
    setHistoryBooks(historyBooks.filter(book => book.id !== id));
  };

  return (
    <div className="history-page">
      <h2 className="history-title">HISTORY</h2>
      
      <div className="history-list">
        {historyBooks.map((book) => (
          <div key={book.id} className="history-item-container">
            <div className="history-item-card">
              <img src={book.cover} alt={book.title} className="history-cover" />
              
              <div className="history-info">
                <div className="history-header-row">
                  <h3 className="book-title">{book.title}</h3>
                  <X 
                    className="remove-icon" 
                    size={24} 
                    onClick={() => removeBook(book.id)} 
                  />
                </div>

                <ReviewComponent rating={4} count={1} />
                
                <BookInfoStats 
                  author={book.author} 
                  genre={book.genre} 
                  producer={book.producer} 
                  status={book.status} 
                />

                <div className="history-actions">
                  <button className="read-btn-small">Read</button>
                  <span className="history-timestamp">
                    {book.type}: <strong>{book.date}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;