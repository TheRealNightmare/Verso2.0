import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StarRating from './ui/StarRating';
import Button from './ui/Button';
import { postReview } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ReviewForm = ({ bookId, existingReview, onSubmitted }) => {
  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm text-sm text-slate-600 mb-6">
        <Link to="/login" className="text-[#5b7c99] font-medium hover:underline">
          Log in
        </Link>{' '}
        to rate and review this book.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await postReview(bookId, { rating, comment: comment.trim() || null });
      toast.success('Review submitted');
      onSubmitted?.();
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else toast.error('Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-3">
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && <span className="text-sm text-slate-500">{rating}/5</span>}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Share your thoughts (optional)…"
        className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/40"
      />

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <div className="mt-3">
        <Button type="submit" loading={submitting} loadingLabel="Submitting…">
          {existingReview ? 'Update review' : 'Submit review'}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
