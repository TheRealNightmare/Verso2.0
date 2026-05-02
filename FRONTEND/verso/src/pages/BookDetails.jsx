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

  if (loading) return <p style={{ padding: '2rem', color: '#aaa' }}>Loading...</p>;
  if (!book) return <p style={{ padding: '2rem', color: '#aaa' }}>Book not found.</p>;

  return (
    <div className="book-details-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} /> Back
      </button>

      <div className="details-layout">
        <div className="details-left">
          <div className="large-book-card">
            <img
              src={book.cover_image_url || 'https://via.placeholder.com/300x450'}
              alt={book.title}
            />
          </div>
        </div>

        <div className="details-right">
          <h1 className="details-title">{book.title}</h1>

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

          <p className="details-description">"{book.description}"</p>

          <div className="comment-header-row">
            <h3>Comments ({book.reviews?.length ?? 0})</h3>
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
