import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import ReviewComponent from '../components/ReviewComponent';
import BookInfoStats from '../components/BookInfoStats';
import { fetchHistory, deleteHistory } from '../api/history';

const History = () => {
  const navigate = useNavigate();
  const [historyBooks, setHistoryBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory()
      .then(setHistoryBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const removeBook = async (id) => {
    try {
      await deleteHistory(id);
      setHistoryBooks((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p style={{ padding: '2rem', color: '#aaa' }}>Loading history...</p>;

  return (
    <div className="history-page">
      <h2 className="history-title">HISTORY</h2>

      {historyBooks.length === 0 && (
        <p style={{ color: '#aaa', padding: '1rem' }}>No reading history yet.</p>
      )}

      <div className="history-list">
        {historyBooks.map((entry) => {
          const book = entry.book;
          return (
            <div key={entry.id} className="history-item-container">
              <div className="history-item-card">
                <img
                  src={book?.cover_image_url || 'https://via.placeholder.com/120x180'}
                  alt={book?.title}
                  className="history-cover"
                />

                <div className="history-info">
                  <div className="history-header-row">
                    <h3 className="book-title">{book?.title}</h3>
                    <X className="remove-icon" size={24} onClick={() => removeBook(entry.id)} />
                  </div>

                  <ReviewComponent rating={Math.round(book?.average_rating ?? 0)} count={0} />

                  <BookInfoStats
                    author={book?.author}
                    genre={book?.genre || 'Literature'}
                    producer="Project Gutenberg"
                    status={`${entry.progress}%`}
                  />

                  <div className="history-actions">
                    <button className="read-btn-small" onClick={() => navigate(`/read/${book?.id}`)}>
                      Read
                    </button>
                    <span className="history-timestamp">
                      Last read: <strong>{new Date(entry.last_read_at).toLocaleString()}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;
