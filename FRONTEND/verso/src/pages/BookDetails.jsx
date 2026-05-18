import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import BookInfoStats from '../components/BookInfoStats';
import ActionButtons from '../components/ActionButtons';
import ReviewComponent from '../components/ReviewComponent';
import CommentComponent from '../components/CommentComponent';
import { fetchBook } from '../api/books';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBook(id)
      .then(setBook)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-8 text-slate-400">Loading...</p>;
  if (!book) return <p className="p-8 text-slate-400">Book not found.</p>;

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
            <img
              src={book.cover_image_url || 'https://via.placeholder.com/300x450'}
              alt={book.title}
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">{book.title}</h1>

          <ReviewComponent
            rating={Math.round(book.average_rating)}
            count={book.reviews_count ?? book.reviews?.length ?? 0}
          />

          <BookInfoStats
            author={book.author}
            genre={book.genre || 'Literature'}
            producer="Project Gutenberg"
            status={book.published_year ? String(book.published_year) : 'Classic'}
          />

          <ActionButtons
            bookId={book.id}
            isBookmarked={book.is_bookmarked}
            isFavorited={book.is_favorited}
          />

          <p className="italic text-slate-600 leading-relaxed my-6">"{book.description}"</p>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800">
              Comments ({book.reviews?.length ?? 0})
            </h3>
          </div>

          {(book.reviews || []).map((review) => (
            <CommentComponent
              key={review.id}
              user={review.user?.name ?? 'Anonymous'}
              time={new Date(review.created_at).toLocaleString()}
              text={review.comment || `Rated ${review.rating}/5`}
              avatar={`https://i.pravatar.cc/100?u=${review.user_id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
