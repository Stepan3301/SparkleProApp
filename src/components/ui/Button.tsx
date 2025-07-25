import React from 'react';

export type ButtonVariant = 
  | 'primary'
  | 'secondary' 
  | 'nav-back'
  | 'nav-next'
  | 'signout'
  | 'view'
  | 'edit'
  | 'delete'
  | 'selection'
  | 'toggle'
  | 'fab';

export type ButtonShape = 
  | 'organic'
  | 'bubble'
  | 'soap'
  | 'droplet'
  | 'sparkle';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  shape?: ButtonShape;
  size?: ButtonSize;
  active?: boolean;
  selected?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  shape = 'bubble',
  size = 'md',
  active = false,
  selected = false,
  children,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  // Base styles
  const baseStyles = `
    relative inline-flex items-center justify-center gap-2 font-semibold cursor-pointer 
    transition-all duration-300 ease-out overflow-hidden border-2 active:scale-95
    ${fullWidth ? 'w-full' : 'min-w-[120px]'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  // Shape styles using clip-path and border-radius
  const shapeStyles = {
    organic: `clip-path: polygon(8% 0%, 92% 0%, 100% 25%, 100% 75%, 92% 100%, 8% 100%, 0% 75%, 0% 25%)`,
    bubble: 'border-radius: 50px 20px 50px 20px',
    soap: 'border-radius: 25px 8px 25px 8px',
    droplet: 'border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%',
    sparkle: `clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); padding: 16px 20px`
  };



  // Combine all styles
  const buttonClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${className}
  `;

  const buttonStyle = {
    ...(() => {
      if (shape === 'organic' || shape === 'sparkle') {
        return { clipPath: shapeStyles[shape].split(': ')[1] };
      } else {
        return { borderRadius: shapeStyles[shape].split(': ')[1] };
      }
    })(),
    ...(variant === 'primary' && {
      background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      color: 'white',
      borderColor: 'transparent'
    }),
    ...(variant === 'secondary' && {
      background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      color: 'white',
      borderColor: 'transparent'
    }),
    ...(variant === 'nav-back' && {
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      color: '#2563EB',
      borderColor: 'rgba(37, 99, 235, 0.2)'
    }),
    ...(variant === 'nav-next' && {
      background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      color: 'white',
      borderColor: 'transparent'
    }),
    ...(variant === 'signout' && {
      background: 'linear-gradient(135deg, #F24236 0%, #FF6B6B 100%)',
      color: 'white',
      borderColor: 'transparent'
    }),
    ...(variant === 'view' && {
      background: 'linear-gradient(135deg, #17A2B8 0%, #6FDBF0 100%)',
      color: 'white',
      borderColor: 'transparent'
    }),
    ...(variant === 'edit' && {
      background: 'linear-gradient(135deg, #F6AE2D 0%, #FFD93D 100%)',
      color: '#333',
      borderColor: 'transparent'
    }),
    ...(variant === 'delete' && {
      background: 'linear-gradient(135deg, #F24236 0%, #FF8A80 100%)',
      color: 'white',
      borderColor: 'transparent'
    }),
    ...(variant === 'selection' && {
      background: selected 
        ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
      color: selected ? 'white' : '#2563EB',
      borderColor: selected ? '#2563EB' : '#dbeafe',
      boxShadow: selected ? '0 4px 15px rgba(37, 99, 235, 0.3)' : undefined
    }),
    ...(variant === 'toggle' && {
      background: active 
        ? 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
        : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      color: 'white',
      borderColor: 'transparent',
      boxShadow: active ? '0 4px 15px rgba(16, 185, 129, 0.3)' : undefined
    }),
    ...(variant === 'fab' && {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
      color: 'white',
      border: 'none',
      fontSize: '24px',
      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
      minWidth: 'auto'
    })
  };

  return (
    <button
      className={buttonClasses}
      style={buttonStyle}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="icon-left">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="icon-right">{rightIcon}</span>}
    </button>
  );
};

export default Button; 