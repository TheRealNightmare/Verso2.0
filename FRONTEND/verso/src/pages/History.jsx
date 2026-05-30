import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import ReviewComponent from '../components/ReviewComponent';
import BookInfoStats from '../components/BookInfoStats';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { fetchHistory, deleteHistory } from '../api/history';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import usePageTitle from '../hooks/usePageTitle';

const History = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [historyBooks, setHistoryBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  usePageTitle('History');

  useEffect(() => {
    fetchHistory()
      .then(setHistoryBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const removeBook = async (id, title) => {
    const ok = await confirm({
      title: 'Remove from history?',
      message: `"${title}" will be removed from your reading history.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteHistory(id);
      setHistoryBooks((prev) => prev.filter((entry) => entry.id !== id));
      toast.success('Removed from history');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove from history.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-400">
        <Spinner label="Loading history…" />
      </div>
    );
  }

  return (
    <div className="px-2">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-wide">HISTORY</h2>

      {historyBooks.length === 0 && (
        <p className="text-slate-400 py-4">No reading history yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {historyBooks.map((entry) => {
          const isUpload = !entry.book && entry.user_upload;
          const upload = entry.user_upload;
          const book = entry.book;
          const title = isUpload ? upload?.title : book?.title;
          const author = isUpload ? (upload?.author || 'Unknown author') : book?.author;
          const cover = isUpload ? null : book?.cover_image_url;
          const readPath = isUpload ? `/reading/upload/${upload?.id}` : `/read/${book?.id}`;
          const producer = isUpload ? `Local ${upload?.format?.toUpperCase()} file` : 'Project Gutenberg';
          const genre = isUpload ? 'Personal library' : (book?.genre || 'Literature');
          const rating = isUpload ? 0 : Math.round(book?.average_rating ?? 0);

          return (
            <div key={entry.id} className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
              <div className="flex gap-3 sm:gap-5">
                {cover ? (
                  <img
                    src={cover}
                    alt={title}
                    className="w-20 h-28 sm:w-28 sm:h-40 object-cover rounded-md shrink-0"
                  />
                ) : (
                  <div className="w-20 h-28 sm:w-28 sm:h-40 rounded-md shrink-0 bg-linear-to-br from-slate-200 to-slate-400 flex items-center justify-center text-white text-xs font-bold uppercase">
                    {isUpload ? upload?.format : 'Book'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 min-w-0 break-words">{title}</h3>
                    <button
                      type="button"
                      aria-label={`Remove ${title} from history`}
                      onClick={() => removeBook(entry.id, title)}
                      className="text-slate-400 hover:text-red-500 rounded p-0.5"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  <ReviewComponent rating={rating} count={0} />

                  <BookInfoStats
                    author={author}
                    genre={genre}
                    producer={producer}
                  />

                  <div className="mt-2">
                    <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-[#4f7aa3] to-[#bcd2e8] transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, entry.progress || 0))}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500 text-right">
                      {entry.progress || 0}% read
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    <Button onClick={() => navigate(readPath)} className="px-4 py-1.5">
                      Read
                    </Button>
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
