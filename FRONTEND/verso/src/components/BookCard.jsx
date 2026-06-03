import { Link } from 'react-router-dom';
import { resolveFileUrl } from '../lib/assets';

const BookCard = ({ id, title, author, cover, reason }) => {
  return (
    <Link
      to={`/book/${id}`}
      className="block w-32 shrink-0 transition-transform hover:scale-105"
    >
      <img
        src={resolveFileUrl(cover)}
        alt={title || 'Book'}
        className="w-full h-48 object-cover rounded-md shadow-md"
      />
      {title && (
        <p className="mt-2 text-sm text-slate-700 truncate">{title}</p>
      )}
      {author && (
        <p className="text-sm font-semibold text-slate-900 truncate">{author}</p>
      )}
      {reason && (
        <p className="mt-0.5 text-xs italic text-[#5b7c99] line-clamp-2" title={reason}>{reason}</p>
      )}
    </Link>
  );
};

export default BookCard;
