import { Link } from 'react-router-dom';

const BookCard = ({ id, title, author, cover }) => {
  return (
    <Link
      to={`/book/${id}`}
      className="block w-32 shrink-0 transition-transform hover:scale-105"
    >
      <img
        src={cover}
        alt={title || 'Book'}
        className="w-full h-48 object-cover rounded-md shadow-md"
      />
      {title && (
        <p className="mt-2 text-sm text-slate-700 truncate">{title}</p>
      )}
      {author && (
        <p className="text-sm font-semibold text-slate-900 truncate">{author}</p>
      )}
    </Link>
  );
};

export default BookCard;
