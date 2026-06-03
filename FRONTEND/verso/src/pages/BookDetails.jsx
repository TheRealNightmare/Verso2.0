import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, PenSquare } from 'lucide-react';
import BookInfoStats from '../components/BookInfoStats';
import ActionButtons from '../components/ActionButtons';
import ReviewComponent from '../components/ReviewComponent';
import CommentComponent from '../components/CommentComponent';
import ReviewForm from '../components/ReviewForm';
import Spinner from '../components/ui/Spinner';
import { fetchBook, refreshBook } from '../api/books';
import { useAuth } from '../context/AuthContext';
import { resolveFileUrl } from '../lib/assets';
import usePageTitle from '../hooks/usePageTitle';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  usePageTitle(book?.title || 'Book');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBook(id)
      .then((data) => {
        if (cancelled) return;
        setBook(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load book.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const refresh = () => {
    refreshBook(id)
      .then(setBook)
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="px-2 py-6 text-sm text-gray-500">
        <Spinner label="Loading book…" />
      </div>
    );
  }
  if (error || !book) {
    return (
      <p className="px-2 py-6 text-sm text-red-600">
        {error || 'Book not found.'}
      </p>
    );
  }

  const comments = (book.reviews || []).map((r) => ({
    id: r.id,
    user: r.user?.name || 'Anonymous',
    time: r.created_at,
    text: r.comment,
    avatar: r.user?.avatar_url,
  }));

  const existingReview = (book.reviews || []).find((r) => r.user_id === user?.id);

  return (
    <div className="px-2">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#5b7c99] mb-6"
      >
        <ChevronLeft size={20} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="relative overflow-hidden rounded-lg shadow-md">
              {book.bestseller_tag && (
                <div className="absolute top-3 left-0 right-0 bg-red-600 text-white text-[10px] font-bold text-center py-1 tracking-wide z-10">
                  {book.bestseller_tag}
                </div>
              )}
              <img
                src={resolveFileUrl(book.cover_image_url)}
                alt={book.title}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">{book.title}</h1>

          <ReviewComponent rating={book.average_rating} count={book.reviews_count} />

          <BookInfoStats
            author={book.author}
            genre={book.genre}
            producer={book.producer}
            status={book.release_status}
          />

          {book.source === 'author' && (book.author_user || book.authorUser) && (
            (() => {
              const u = book.author_user || book.authorUser;
              return (
                <p className="text-sm text-slate-500 -mt-2 mb-3 flex items-center gap-1">
                  <PenSquare size={14} className="text-amber-600" />
                  Published by{' '}
                  <Link to={`/users/${u.id}`} className="text-[#5b7c99] hover:underline">
                    @{u.name}
                  </Link>
                </p>
              );
            })()
          )}

          <ActionButtons bookId={book.id} />

          <p className="italic text-slate-600 leading-relaxed my-6">"{book.description}"</p>

          <h3 className="text-lg font-semibold text-slate-800 mb-3">Write a review</h3>
          <ReviewForm
            bookId={book.id}
            existingReview={existingReview}
            onSubmitted={refresh}
          />

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800">
              Comment ({comments.length})
            </h3>
          </div>

          {comments.map((c) => (
            <CommentComponent
              key={c.id}
              user={c.user}
              time={c.time}
              text={c.text}
              avatar={c.avatar}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
