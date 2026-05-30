import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { getMyUploadedBooks, deleteMyBook } from '../api/authorBooks';
import { resolveFileUrl } from '../lib/assets';
import { Trash2, Plus, Star, Heart, MessageSquare } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function AuthorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  usePageTitle('My Published Books');

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyUploadedBooks()
      .then((data) => { if (active) setBooks(data); })
      .catch(() => { if (active) toast.error('Failed to load your books.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const onDelete = async (book) => {
    const ok = await confirm({
      title: 'Delete this book?',
      message: `"${book.title}" will be permanently removed.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteMyBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      toast.success('Book deleted.');
    } catch {
      toast.error('Could not delete.');
    }
  };

  if (user && user.role !== 'author') {
    return (
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Author access required</h1>
        <p className="text-slate-600">Only author accounts can see this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">My Published Books</h1>
        <Link
          to="/author/publish"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#5b7c99] text-white text-sm font-medium hover:bg-[#4a6a85]"
        >
          <Plus size={16} /> Publish new
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : books.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-500">
          You haven&apos;t published any books yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
          {books.map((b) => (
            <div key={b.id} className="flex items-center gap-4 p-4">
              <img
                src={resolveFileUrl(b.cover_image_url)}
                alt=""
                className="w-14 h-20 object-cover rounded-md bg-slate-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/book/${b.id}`} className="block text-slate-800 font-medium truncate hover:underline">
                  {b.title}
                </Link>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><MessageSquare size={12} />{b.reviews_count ?? 0}</span>
                  <span className="flex items-center gap-1"><Heart size={12} />{b.favorites_count ?? 0}</span>
                  {b.average_rating ? (
                    <span className="flex items-center gap-1"><Star size={12} />{Number(b.average_rating).toFixed(1)}</span>
                  ) : null}
                  {b.is_exclusive ? <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700">Exclusive</span> : null}
                </div>
              </div>
              <button
                onClick={() => onDelete(b)}
                className="p-2 text-slate-400 hover:text-red-600"
                aria-label="Delete book"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
