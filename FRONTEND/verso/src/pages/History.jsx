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

  if (loading) return <p className="p-8 text-slate-400">Loading history...</p>;

  return (
    <div className="px-2">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-wide">HISTORY</h2>

      {historyBooks.length === 0 && (
        <p className="text-slate-400 py-4">No reading history yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {historyBooks.map((entry) => {
          const book = entry.book;
          return (
            <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex gap-5">
                <img
                  src={book?.cover_image_url || 'https://via.placeholder.com/120x180'}
                  alt={book?.title}
                  className="w-28 h-40 object-cover rounded-md shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">{book?.title}</h3>
                    <X
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                      size={22}
                      onClick={() => removeBook(entry.id)}
                    />
                  </div>

                  <ReviewComponent rating={Math.round(book?.average_rating ?? 0)} count={0} />

                  <BookInfoStats
                    author={book?.author}
                    genre={book?.genre || 'Literature'}
                    producer="Project Gutenberg"
                    status={`${entry.progress}%`}
                  />

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => navigate(`/read/${book?.id}`)}
                      className="px-4 py-1.5 rounded-lg bg-[#5b7c99] text-white text-sm hover:bg-[#4a6a85]"
                    >
                      Read
                    </button>
                    <span className="text-xs text-slate-500">
                      Last read:{' '}
                      <strong className="text-slate-700">
                        {new Date(entry.last_read_at).toLocaleString()}
                      </strong>
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
