import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import BookInfoStats from '../components/BookInfoStats';
import ActionButtons from '../components/ActionButtons';
import ReviewComponent from '../components/ReviewComponent';
import CommentComponent from '../components/CommentComponent';

const BookDetails = () => {
  const navigate = useNavigate();

  // For now, we are using static data to match your "Think Again" screenshot
  const bookData = {
    title: "Think Again",
    author: "Dong Vu",
    genre: "Romance",
    producer: "Updating",
    status: "25/50",
    rating: 4,
    reviews: 1,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    cover: "https://via.placeholder.com/300x450" // Replace with your Adam Grant cover image
  };

  return (
    <div className="book-details-page">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} /> Back
      </button>

      <div className="details-layout">
        {/* Left Side: Large Book Cover */}
        <div className="details-left">
          <div className="large-book-card">
            <img src={bookData.cover} alt={bookData.title} />
          </div>
        </div>

        {/* Right Side: Information */}
        <div className="details-right">
          <h1 className="details-title">{bookData.title}</h1>
          
          <ReviewComponent rating={bookData.rating} count={bookData.reviews} />

          <BookInfoStats 
            author={bookData.author}
            genre={bookData.genre}
            producer={bookData.producer}
            status={bookData.status}
          />

          <ActionButtons />

          <p className="details-description">
            "{bookData.description}"
          </p>

          <div className="comment-header-row">
             <h3>Comment ({bookData.reviews})</h3>
          </div>

          <CommentComponent 
            user="Harleen Quinzel"
            time="11:22 PM"
            text="AMAZING!!"
            avatar="https://i.pravatar.cc/100?u=harleen"
          />
        </div>
      </div>
    </div>
  );
};

export default BookDetails;