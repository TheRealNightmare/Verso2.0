import { Link } from 'react-router-dom';

const BookCard = ({ id, cover }) => {
  return (
    <Link to={`/book/${id}`} className="plain-book-card">
      <img src={cover} alt="Book" className="card-image" />
    </Link>
  );
};

export default BookCard;