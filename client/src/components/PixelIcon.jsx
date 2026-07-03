import React from 'react';

/**
 * Component hiển thị icon dạng Pixel Art thay cho SVG mặc định.
 * Nếu file ảnh chưa có sẵn, nó sẽ hiển thị một hình vuông giữ chỗ (placeholder) mang phong cách pixel.
 */
export function PixelIcon({ name, className = "w-6 h-6", alt }) {
  // Thay đổi đường dẫn này trỏ tới thư mục assets/ui/ sau khi đã có file ảnh thật.
  // Hiện tại dùng một placeholder có text để phân biệt.
  return (
    <div 
      className={`${className} flex items-center justify-center bg-gray-300 border-2 border-black font-pop-accent text-[8px] overflow-hidden`}
      title={alt || name}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* 
        <img 
          src={`/assets/ui/icon_${name}.png`} 
          alt={alt || name}
          className="w-full h-full object-contain"
          onError={(e) => e.target.style.display = 'none'}
        /> 
      */}
      {name.substring(0, 3).toUpperCase()}
    </div>
  );
}
