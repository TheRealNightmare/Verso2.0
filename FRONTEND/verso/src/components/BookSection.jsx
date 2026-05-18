import React from 'react';
import BookCard from './BookCard';

const BookSection = ({ title, books }) => {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800">
          {title}{' '}
          <span className="text-sm text-slate-400 font-normal ml-1">(view all)</span>
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
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
