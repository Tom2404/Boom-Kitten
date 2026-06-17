import React from 'react';

/**
 * Biểu tượng Xu dạng nét vẽ (Outline Coin Icon).
 * Chỉ vẽ hình dạng/đường viền, không tô màu mặc định. Có thể chỉnh size và màu stroke qua props.
 */
export function CoinIcon({ className = "w-5 h-5", strokeWidth = 2.5 }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <path d="M10 10.5h3.5a1.5 1.5 0 0 0 0-3H11" />
      <path d="M14 13.5H10.5a1.5 1.5 0 0 0 0 3H13" />
    </svg>
  );
}

/**
 * Biểu tượng Đá quý dạng nét vẽ (Outline Gem Icon).
 * Chỉ vẽ hình dạng/đường viền, không tô màu mặc định. Có thể chỉnh size và màu stroke qua props.
 */
export function GemIcon({ className = "w-5 h-5", strokeWidth = 2.5 }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M11 3 8 9l4 12 4-12-3-6" />
      <path d="M2 9h20" />
    </svg>
  );
}

// Giữ lại component mặc định để tránh lỗi import ở các file khác nếu có
export default function CoinDisplay() {
  return (
    <div className="flex gap-4 items-center bg-white border-3 border-on-surface px-4 py-2 rounded-2xl shadow-[3px_3px_0px_0px_#1a1c1c] text-sm font-headline font-black text-on-surface">
      <div className="flex items-center gap-1.5">
        <CoinIcon className="w-5 h-5 text-on-surface" />
        <span>0</span>
      </div>
      <div className="flex items-center gap-1.5">
        <GemIcon className="w-5 h-5 text-on-surface" />
        <span>0</span>
      </div>
    </div>
  );
}
