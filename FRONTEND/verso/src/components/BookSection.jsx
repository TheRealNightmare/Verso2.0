import React from 'react';
import BookCard from './BookCard';

const BookSection = ({ title, books }) => {
  return (
    <section className="book-section">
      <div className="section-header">
        <h2 className="section-title">
          {title} <span className="view-all">(view all)</span>
        </h2>
      </div>
      <div className="book-grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            author={book.author}
            cover={book.cover}
          />
        ))}
      </div>
    </section>
  );
};

export default BookSection;