import React from 'react';

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
  const sizeClasses = {
    sm: 'min-h-9 px-4 py-2 text-sm',
    md: 'min-h-11 px-5 py-2.5 text-base',
    lg: 'min-h-12 px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-[var(--pop-amber)] text-[var(--pop-black)] border-[var(--pop-black)] hover:bg-yellow-300',
    secondary: 'bg-white text-[var(--pop-black)] border-[var(--pop-black)] hover:bg-[var(--pop-cream)]',
    danger: 'bg-[var(--pop-red)] text-white border-[var(--pop-black)] hover:bg-red-500',
    success: 'bg-[var(--pop-green)] text-[var(--pop-black)] border-[var(--pop-black)] hover:bg-emerald-300',
    quit: 'bg-[var(--pop-black)] text-white border-[var(--pop-black)] hover:bg-neutral-800',
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-md border-2 font-semibold tracking-wide transition-colors duration-150 select-none outline-none';
  const stateClasses = disabled || loading
    ? 'opacity-60 cursor-not-allowed'
    : 'cursor-pointer active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pop-black)]';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${stateClasses} ${className}`}
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
