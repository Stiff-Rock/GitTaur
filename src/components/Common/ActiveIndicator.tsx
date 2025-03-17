import React from 'react';

interface ActiveIndicatorProps {
  className?: string;
  style?: React.CSSProperties;
}

const ActiveIndicator: React.FC<ActiveIndicatorProps> = ({ className, style }) => {
  return (
    <svg
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50%" cy="50%" r="40%" fill="#50FA7B" />
    </svg>
  );
}

export default ActiveIndicator;
