import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { fetchBookmarks, removeBookmark } from '../api/bookmarks';

const Storage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks()
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (bookId) => {
    try {
      await removeBookmark(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p style={{ padding: '2rem', color: '#aaa' }}>Loading bookmarks...</p>;

  return (
    <div className="storage-page">
      <h2 className="storage-title">STORAGE</h2>

      {books.length === 0 && (
        <p style={{ color: '#aaa', padding: '1rem' }}>No saved books yet.</p>
      )}

      <div className="storage-grid">
        {books.map((book) => (
          <div key={book.id} className="storage-item">
            <div className="storage-cover-wrapper" style={{ position: 'relative' }}>
              <Link to={`/book/${book.id}`}>
                <img
                  src={book.cover_image_url || 'https://via.placeholder.com/150x225'}
                  alt={book.title}
                  className="storage-cover"
                />
              </Link>
              <button
                onClick={() => handleRemove(book.id)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'rgba(0,0,0,0.5)', border: 'none',
                  borderRadius: '50%', cursor: 'pointer', padding: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} color="#fff" />
              </button>
            </div>
            <div className="storage-info">
              <h4 className="book-name">{book.title}</h4>
              <p className="book-author">{book.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Storage;
