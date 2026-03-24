import React from 'react';

const BookCard = ({ cover, altText }) => {
  return (
    <div className="plain-book-card">
      <div className="image-wrapper">
        <img src={cover} alt={altText || "Book Cover"} />
      </div>
    </div>
  );
};

export default BookCard;