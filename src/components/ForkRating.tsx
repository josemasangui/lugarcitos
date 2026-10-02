import React from 'react';

interface ForkRatingProps {
  score: number;
  symbol?: string;
  size?: number;
  showNumber?: boolean;
  interactive?: boolean;
  onChange?: (val: number) => void;
  activeColor?: string;
  inactiveColor?: string;
}

export const CutleryIcon: React.FC<{
  size?: number;
  color?: string;
  className?: string;
}> = ({ size = 18, color = '#C85A32', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block flex-shrink-0 ${className}`}
  >
    {/* Fork (Left) with 4 neat tines */}
    <path d="M5.2 3.5v4.2c0 1.3 0.8 2.3 1.9 2.5v9.8a0.9 0.9 0 0 0 1.8 0v-9.8c1.1-0.2 1.9-1.2 1.9-2.5V3.5h-1v3.8h-0.8V3.5h-1v3.8h-0.8V3.5H5.2z" />
    {/* Dining Knife (Right) with sleek curved blade */}
    <path d="M14.2 3.5h0.8c2.4 0 3.8 2.2 3.8 5.8v1.7h-1.8v9a0.9 0.9 0 0 1-1.8 0v-16.5c-0.6 0-1 0-1 0z" />
  </svg>
);

export const ForkRating: React.FC<ForkRatingProps> = ({
  score,
  size = 18,
  showNumber = true,
  interactive = false,
  onChange,
  activeColor = '#C85A32',
  inactiveColor = '#D5CBC0'
}) => {
  const clamped = Math.max(0, Math.min(5, score));

  return (
    <div className="inline-flex items-center gap-1.5 select-none align-middle">
      <div className="inline-flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
          // Calculate fill state for this slot:
          // full (1.0), half (0.5), or empty (0.0)
          const diff = clamped - (i - 1);
          const isFull = diff >= 0.75;
          const isHalf = !isFull && diff >= 0.25;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(i)}
              className={`p-0 bg-transparent border-0 leading-none transition-transform relative flex items-center justify-center ${
                interactive
                  ? 'cursor-pointer hover:scale-125 focus:outline-none'
                  : 'cursor-default'
              }`}
              style={{ width: `${size}px`, height: `${size}px` }}
              title={`${i} de 5 cuchillos y tenedores (${clamped.toFixed(1)})`}
            >
              {/* Background layer (empty cutlery) */}
              <CutleryIcon size={size} color={inactiveColor} />

              {/* 100% Full Cutlery */}
              {isFull && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(200,90,50,0.25))'
                  }}
                >
                  <CutleryIcon size={size} color={activeColor} />
                </div>
              )}

              {/* 50% Half-Filled Cutlery with clean 50% mask */}
              {isHalf && (
                <div
                  className="absolute top-0 left-0 bottom-0 pointer-events-none overflow-hidden"
                  style={{
                    width: '50%',
                    filter: 'drop-shadow(0 1px 2px rgba(200,90,50,0.25))'
                  }}
                >
                  <div style={{ width: `${size}px`, height: `${size}px` }}>
                    <CutleryIcon size={size} color={activeColor} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Numerical score displayed right beside the cutlery icons */}
      {showNumber && (
        <span className="ml-1 text-xs sm:text-sm font-bold text-[#181816] tracking-tight font-sans">
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
};
