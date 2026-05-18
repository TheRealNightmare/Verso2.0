import { Link } from 'react-router-dom';

const BookCard = ({ id, cover }) => {
  return (
    <Link
      to={`/book/${id}`}
      className="block w-32 shrink-0 transition-transform hover:scale-105"
    >
      <img
        src={cover}
        alt="Book"
        className="w-full h-48 object-cover rounded-md shadow-md"
      />
    </Link>
  );
};

export default BookCard;
