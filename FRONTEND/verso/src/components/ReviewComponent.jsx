import React from 'react';
import { Star } from 'lucide-react';

const ReviewComponent = ({ rating, count }) => {
  return (
    <div className="review-row">
      <span className="rating-digit">{rating}</span>
      <div className="star-group">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            fill={i < rating ? "#f1c40f" : "none"} 
            stroke={i < rating ? "#f1c40f" : "#cbd5e1"} 
          />
        ))}
      </div>
      <span className="review-divider">•</span>
      <span className="review-text">{count} Review</span>
    </div>
  );
};

export default ReviewComponent;
