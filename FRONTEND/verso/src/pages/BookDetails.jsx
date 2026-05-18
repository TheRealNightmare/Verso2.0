import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import BookInfoStats from '../components/BookInfoStats';
import ActionButtons from '../components/ActionButtons';
import ReviewComponent from '../components/ReviewComponent';
import CommentComponent from '../components/CommentComponent';
// TODO: replace getBookById with fetchBook(id) when API is ready
import { getBookById } from '../mocks/books';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = getBookById(id);

  return (
    <div className="px-2">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#5b7c99] mb-6"
      >
        <ChevronLeft size={20} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="relative overflow-hidden rounded-lg shadow-md">
              {book.bestseller_tag && (
                <div className="absolute top-3 left-0 right-0 bg-red-600 text-white text-[10px] font-bold text-center py-1 tracking-wide z-10">
                  {book.bestseller_tag}
                </div>
              )}
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">{book.title}</h1>

          <ReviewComponent rating={book.rating} count={book.reviews_count} />

          <BookInfoStats
            author={book.author}
            genre={book.genre}
            producer={book.producer}
            status={book.release_status}
          />

          <ActionButtons bookId={book.id} />

          <p className="italic text-slate-600 leading-relaxed my-6">"{book.description}"</p>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-800">
              Comment ({book.comments?.length ?? 0})
            </h3>
          </div>

          {(book.comments || []).map((c) => (
            <CommentComponent
              key={c.id}
              user={c.user}
              time={c.time}
              text={c.text}
              avatar={c.avatar}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
