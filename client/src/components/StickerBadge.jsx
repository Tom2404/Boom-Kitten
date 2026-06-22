import React from 'react';

/**
 * StickerBadge - A retro sticker badge with solid outlines and offset shadows
 * 
 * @param {Object} props
 * @param {string} props.bgColor - Background color class or inline color
 * @param {string} props.textColor - Text color class or inline color
 * @param {string} props.shadowColor - Shadow color (e.g. 'var(--pop-black)')
 * @param {number} props.rotate - Rotation in degrees (e.g. -2, 3)
 * @param {string} props.className - Additional classes
 * @param {React.ReactNode} props.children - Inner content
 */
export default function StickerBadge({
  bgColor = 'var(--pop-amber)',
  textColor = 'var(--pop-black)',
  shadowColor = 'var(--pop-black)',
  rotate = 0,
  className = '',
  children,
  ...props
}) {
  const badgeStyle = {
    backgroundColor: bgColor,
    color: textColor,
    transform: `rotate(${rotate}deg)`,
    boxShadow: `3px 3px 0 ${shadowColor}`,
  };

  return (
    <div
      className={`inline-block font-pop-accent uppercase text-xs md:text-sm font-bold px-4 py-1.5 pop-border-2 select-none ${className}`}
      style={badgeStyle}
      {...props}
    >
      {children}
    </div>
  );
}
