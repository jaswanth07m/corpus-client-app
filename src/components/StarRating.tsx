import { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={26}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`
            cursor-pointer transition
            ${(hover || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          `}
        />
      ))}
    </div>
  );
};

// loading="lazy"                            // avoids loading until needed
//   decoding="async"                          // faster decoding
//   referrerPolicy="no-referrer"
