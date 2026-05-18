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

  if (loading) return <p className="p-8 text-slate-400">Loading bookmarks...</p>;

  return (
    <div className="px-2">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-wide">STORAGE</h2>

      {books.length === 0 && <p className="text-slate-400 py-4">No saved books yet.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-5">
        {books.map((book) => (
          <div key={book.id} className="flex flex-col">
            <div className="relative group">
              <Link to={`/book/${book.id}`}>
                <img
                  src={book.cover_image_url || 'https://via.placeholder.com/150x225'}
                  alt={book.title}
                  className="w-full h-56 object-cover rounded-md shadow-md"
                />
              </Link>
              <button
                onClick={() => handleRemove(book.id)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
              >
                <X size={14} color="#fff" />
              </button>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium text-slate-800 truncate">{book.title}</h4>
              <p className="text-xs text-slate-500 truncate">{book.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Storage;
