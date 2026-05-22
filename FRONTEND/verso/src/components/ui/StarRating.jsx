import { useState } from 'react';
import { Star } from 'lucide-react';

// Interactive star picker (input). Mirrors the read-only palette used by
// ReviewComponent (#f1c40f filled, #cbd5e1 empty) for visual consistency.
const StarRating = ({ value = 0, onChange, size = 28, readOnly = false }) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-1" role={readOnly ? undefined : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            aria-pressed={star === value}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`p-0.5 rounded ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Star
              size={size}
              fill={filled ? '#f1c40f' : 'none'}
              stroke={filled ? '#f1c40f' : '#cbd5e1'}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
