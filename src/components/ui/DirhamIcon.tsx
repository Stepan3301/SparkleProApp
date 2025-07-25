import React from 'react';

interface DirhamIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'black' | 'white' | 'inherit';
}

const DirhamIcon: React.FC<DirhamIconProps> = ({ size = 'md', className = '', color = 'inherit' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  const filterStyles = {
    black: { filter: 'brightness(0)' },
    white: { filter: 'brightness(0) invert(1)' },
    inherit: {}
  };

  return (
    <img 
      src="/dirham-sign.png" 
      alt="AED" 
      className={`inline-block ${sizeClasses[size]} ${className}`}
      style={filterStyles[color]}
    />
  );
};

export default DirhamIcon; 