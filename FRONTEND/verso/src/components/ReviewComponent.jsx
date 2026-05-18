import React from 'react';
import { Star } from 'lucide-react';

const ReviewComponent = ({ rating, count }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="font-semibold text-slate-800">{rating}</span>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < rating ? '#f1c40f' : 'none'}
            stroke={i < rating ? '#f1c40f' : '#cbd5e1'}
          />
        ))}
      </div>
      <span className="text-slate-300">•</span>
      <span>{count} Review</span>
    </div>
  );
};

export default ReviewComponent;
