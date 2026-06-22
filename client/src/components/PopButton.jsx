import React from 'react';

/**
 * PopButton - A reusable Neo-brutalism/Pop Art button component
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'dark' | 'outline'} props.variant - Button style variant
 * @param {string} props.shadowColor - Hex or CSS variable for custom shadow color (e.g. '#E24B4A', 'var(--pop-red)')
 * @param {string} props.className - Extra tailwind/css classes
 * @param {React.ReactNode} props.children - Button label or contents
 */
export default function PopButton({
  variant = 'primary',
  shadowColor = 'var(--pop-black)',
  className = '',
  children,
  ...props
}) {
  // Base classes that apply to all variants
  const baseClasses = 'inline-flex items-center justify-center font-pop-accent text-center transition-all duration-150 select-none cursor-pointer';
  
  // Design system variant definitions
  let variantClasses = '';
  let shadowStyle = {};
  
  // Custom button styles with pop-art hover/active dynamics
  if (variant === 'primary') {
    // Amber background, black text, bold black border
    variantClasses = 'bg-[var(--pop-amber)] text-[var(--pop-black)] pop-border-3 text-base md:text-lg font-bold px-9 py-[15px]';
    shadowStyle = {
      boxShadow: `6px 6px 0 ${shadowColor}`,
    };
  } else if (variant === 'secondary') {
    // Transparent, white text, semi-transparent border, DM Sans font
    variantClasses = 'bg-transparent text-white font-pop-body font-medium border-2 border-white/50 px-8 py-3.5 hover:border-white transition-colors duration-150';
    shadowStyle = {}; // Secondary button has no hard shadow by design
  } else if (variant === 'dark') {
    // Black background, amber text, bold black border
    variantClasses = 'bg-[var(--pop-black)] text-[var(--pop-amber)] pop-border-3 text-base md:text-lg font-bold px-12 py-[20px]';
    shadowStyle = {
      boxShadow: `8px 8px 0 ${shadowColor}`,
    };
  } else if (variant === 'outline') {
    // Cream background, black text, small border
    variantClasses = 'bg-[var(--pop-cream)] text-[var(--pop-black)] pop-border-2 text-sm font-bold px-5 py-2';
    shadowStyle = {
      boxShadow: `3px 3px 0 ${shadowColor}`,
    };
  }

  // Generate dynamic inline style or Tailwind style for active state mechanism
  // We'll use CSS custom attributes and inline styles for precise shadow control.
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsActive(false);
  };
  const handleMouseDown = () => setIsActive(true);
  const handleMouseUp = () => setIsActive(false);

  // Dynamic transforms and shadow offsets based on state
  let transformStyle = {};
  let currentShadow = shadowStyle.boxShadow;

  if (currentShadow) {
    if (isActive) {
      // Pressed state: buttons shift to cover shadow completely
      if (variant === 'dark') {
        transformStyle = { transform: 'translate(8px, 8px)' };
      } else if (variant === 'primary') {
        transformStyle = { transform: 'translate(6px, 6px)' };
      } else if (variant === 'outline') {
        transformStyle = { transform: 'translate(3px, 3px)' };
      }
      currentShadow = '0px 0px 0 transparent';
    } else if (isHovered) {
      // Hovered state: buttons lift up and shadow gets thicker
      if (variant === 'dark') {
        transformStyle = { transform: 'translate(-4px, -4px)' };
        currentShadow = `12px 12px 0 ${shadowColor}`;
      } else if (variant === 'primary') {
        transformStyle = { transform: 'translate(-3px, -3px)' };
        currentShadow = `9px 9px 0 ${shadowColor}`;
      } else if (variant === 'outline') {
        transformStyle = { transform: 'translate(-2px, -2px)' };
        currentShadow = `5px 5px 0 ${shadowColor}`;
      }
    }
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={{
        ...transformStyle,
        boxShadow: currentShadow,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </button>
  );
}
