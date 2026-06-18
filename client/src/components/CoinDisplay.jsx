import goldCoin from '../assets/currencies/gold_coin.png';
import pinkCoin from '../assets/currencies/pink_coin.png';

/**
 * Biểu tượng Xu Vàng dạng ảnh hoạt họa hoạt hình (Gold Coin Image).
 */
export function CoinIcon({ className = "w-5 h-5" }) {
  return (
    <img 
      src={goldCoin} 
      alt="Gold Coin" 
      className={`${className} object-contain select-none`} 
    />
  );
}

/**
 * Biểu tượng Xu Hồng dạng ảnh hoạt họa hoạt hình (Pink Coin Image).
 */
export function GemIcon({ className = "w-5 h-5" }) {
  return (
    <img 
      src={pinkCoin} 
      alt="Pink Coin" 
      className={`${className} object-contain select-none`} 
    />
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
