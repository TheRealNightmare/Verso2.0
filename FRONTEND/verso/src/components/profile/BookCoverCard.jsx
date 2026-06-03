import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';
import { resolveFileUrl } from '../../lib/assets';

// Five-star row that supports half stars from a numeric average_rating.
const RatingStars = ({ rating }) => {
  const value = Number(rating) || 0;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${value.toFixed(1)} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i)); // 0, partial, or 1
        return (
          <span key={i} className="relative inline-block w-3.5 h-3.5">
            <Star size={14} className="absolute inset-0 text-slate-300" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={14} className="text-amber-400 fill-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
};

/**
 * Grid-friendly book card used on profile pages: poster cover with an optional
 * genre pill, title, author, and a star rating row.
 */
const BookCoverCard = ({ book }) => {
  const cover = resolveFileUrl(book.cover_image_url);
  const rating = Number(book.average_rating) || 0;

  return (
    <Link to={`/book/${book.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-xl bg-slate-100 overflow-hidden shadow-sm ring-1 ring-slate-200">
        {cover ? (
          <img
            src={cover}
            alt={book.title || 'Book cover'}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <BookOpen size={32} />
          </div>
        )}
        {book.genre && (
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {book.genre}
          </span>
        )}
      </div>

      <p className="mt-2 truncate text-sm font-medium text-slate-800 group-hover:text-[#5b7c99]">
        {book.title}
      </p>
      {book.author && (
        <p className="truncate text-xs text-slate-400">{book.author}</p>
      )}
      <div className="mt-1 flex items-center gap-1.5">
        <RatingStars rating={rating} />
        <span className="text-[11px] text-slate-400">
          {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        </span>
      </div>
    </Link>
  );
};

export default BookCoverCard;
