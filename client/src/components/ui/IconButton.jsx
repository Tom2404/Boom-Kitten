import React from 'react';

export function IconButton({
  icon,
  onClick,
  disabled = false,
  className = '',
  title = '',
  ...props
}) {
  const baseClasses = "relative flex items-center justify-center p-2 rounded-full transition-all duration-150 ease-in-out outline-none text-gray-300 bg-gray-800/50 hover:bg-gray-700/80";
  
  const stateClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer hover:text-white active:scale-90 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:ring-offset-gray-900";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${className}`}
      title={title}
      {...props}
    >
      <span className="w-6 h-6 flex items-center justify-center">
        {icon}
      </span>
    </button>
  );
}
