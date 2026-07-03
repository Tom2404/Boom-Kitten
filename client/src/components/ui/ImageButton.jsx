import React from 'react';
import { buttonTheme } from '../../assets/ui/themes/buttonTheme.js';

export function ImageButton({
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  ...props
}) {
  const bgImage = buttonTheme[variant] || buttonTheme.primary;
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-bold',
  };

  const baseClasses = "relative flex items-center justify-center font-semibold text-white tracking-wide transition-all duration-150 ease-in-out bg-center bg-no-repeat bg-cover select-none overflow-hidden outline-none";
  
  // States: hover, active, focus, disabled are handled via Tailwind filters and transforms
  const stateClasses = disabled || loading
    ? "opacity-60 grayscale cursor-not-allowed"
    : "cursor-pointer hover:brightness-110 active:scale-95 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${stateClasses} ${className}`}
      style={{
        backgroundImage: `url(${bgImage})`,
        // Default border radius just in case the background image isn't perfectly masking
        borderRadius: '0.5rem', 
        textShadow: '0px 2px 4px rgba(0,0,0,0.8)',
      }}
      {...props}
    >
      <div className="relative z-10 flex items-center gap-2">
        {loading && (
          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
        )}
        {!loading && icon && <span>{icon}</span>}
        {children && <span>{children}</span>}
      </div>
    </button>
  );
}
