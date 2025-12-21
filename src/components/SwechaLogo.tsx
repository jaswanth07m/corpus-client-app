import React from 'react';

interface SwechaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

const SwechaLogo: React.FC<SwechaLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const birdSizes = {
    sm: 'w-8 h-6',
    md: 'w-12 h-9',
    lg: 'w-16 h-12',
    xl: 'w-20 h-15',
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Flying Birds Logo - Pure CSS */}
      <div className={`relative ${birdSizes[size]}`}>
        <svg
          viewBox="0 0 100 60"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* First bird (top right) */}
          <path
            d="M 65 10 Q 70 5, 75 8 Q 80 5, 85 10 Q 80 12, 75 10 Q 70 12, 65 10"
            fill="black"
            stroke="black"
            strokeWidth="2"
          />
          <path
            d="M 75 10 Q 78 15, 82 18"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Second bird (middle) */}
          <path
            d="M 45 25 Q 50 20, 55 23 Q 60 20, 65 25 Q 60 27, 55 25 Q 50 27, 45 25"
            fill="black"
            stroke="black"
            strokeWidth="2"
          />
          <path
            d="M 55 25 Q 58 30, 62 33"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Swecha Text - Cursive Style */}
      <div className="flex flex-col">
        <span
          className={`font-bold text-black ${textSizes[size]}`}
          style={{
            fontFamily: "'Brush Script MT', cursive, sans-serif",
            fontStyle: 'italic',
            letterSpacing: '0.02em',
          }}
        >
          Swecha
        </span>
        {showTagline && (
          <span
            className={`text-gray-700 italic ${taglineSizes[size]} -mt-1`}
            style={{
              fontFamily: "'Brush Script MT', cursive, sans-serif",
              letterSpacing: '0.05em',
            }}
          >
            Technology for Society
          </span>
        )}
      </div>
    </div>
  );
};

export default SwechaLogo;
