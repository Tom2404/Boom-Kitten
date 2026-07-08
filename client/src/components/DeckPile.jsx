import React from 'react';
import Card from './Card.jsx';

export default function DeckPile({ count, topCard, onDraw, isMyTurn, disabled, compact = false }) {
  const handleDraw = () => {
    if (isMyTurn && !disabled) {
      onDraw();
    }
  };

  const isClickable = isMyTurn && !disabled;

  const sizeClass = compact ? 'h-36 w-28' : 'h-44 w-32';
  const innerTextClass = compact ? 'text-[9px]' : 'text-[10px]';

  const hasFaceUpCard = topCard && topCard.faceUp;

  // Dynamic stack layers based on remaining deck count
  const stackLayers = Math.min(Math.ceil(count / 8), 4);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-headline font-black text-white uppercase tracking-wider bg-on-background px-3 py-0.5 rounded-lg border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] rotate-[-2deg]">BÀI BỐC</span>
      
      <div
        id="deck-pile-element"
        onClick={handleDraw}
        className={`relative ${sizeClass} select-none transition-all duration-150 rounded-xl
          ${hasFaceUpCard
            ? 'bg-transparent border-0 ' + (isClickable
                ? 'cursor-pointer hover:-translate-y-2.5 hover:scale-[1.03]'
                : 'cursor-pointer hover:-translate-y-1')
            : 'border-3 border-on-surface bg-[#b7131a] p-3 ' + (isClickable
                ? 'cursor-pointer hover:-translate-y-2.5 hover:scale-[1.03] hover:shadow-[6px_8px_0px_0px_rgba(26,28,28,1)] shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]'
                : 'border-slate-800 cursor-pointer hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]')}`}
      >
        {/* Dynamic 3D stack effect — layers scale with card count */}
        {stackLayers >= 1 && count > 1 && (
          <div className="absolute inset-0 bg-[#a01015] border-3 border-on-surface rounded-xl translate-x-1 translate-y-1 -z-10 opacity-90" />
        )}
        {stackLayers >= 2 && (
          <div className="absolute inset-0 bg-[#8a0e12] border-3 border-on-surface rounded-xl translate-x-2 translate-y-2 -z-20 opacity-75" />
        )}
        {stackLayers >= 3 && (
          <div className="absolute inset-0 bg-[#740c10] border-3 border-on-surface rounded-xl translate-x-3 translate-y-3 -z-30 opacity-60" />
        )}
        {stackLayers >= 4 && (
          <div className="absolute inset-0 bg-[#5e0a0e] border-3 border-on-surface rounded-xl translate-x-4 translate-y-4 -z-40 opacity-45" />
        )}

        {/* Custom Spikey Starburst SVG or Face-Up top card */}
        {hasFaceUpCard ? (
          <div className="absolute inset-0 bg-transparent flex items-center justify-center overflow-visible pointer-events-none">
            <Card type={topCard.type} disabled={false} compact={compact} />
          </div>
        ) : (
          <div className="absolute inset-2 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center bg-[#b7131a]">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current drop-shadow-[2px_2px_0px_#1a1c1c]">
              <path d="M12 2l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z" />
            </svg>
            <span className={`mt-2 ${innerTextClass} font-headline font-black text-white tracking-wider uppercase drop-shadow`}>MÈO NỔ</span>
          </div>
        )}

        {/* Floating badge for card count - black with white text */}
        <div className="absolute -top-3.5 -right-3.5 h-9 w-9 rounded-full bg-[#1a1c1c] border-3 border-white flex items-center justify-center text-xs font-headline font-black text-white shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
          {count}
        </div>

        {/* Draw arrow indicator when clickable */}
        {isClickable && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[1px_1px_0px_#1a1c1c]">
              <path d="M10 12L2 4H6V0H14V4H18L10 12Z" fill="#facc15" stroke="#1a1c1c" strokeWidth="2" strokeLinejoin="miter" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <span className={`text-[9px] font-headline font-black text-center max-w-[120px] leading-tight uppercase mt-1
          ${isClickable ? 'text-yellow-400 animate-pulse' : 'text-slate-400'}`}>
          {isClickable ? 'Bốc bài để hết lượt!' : 'Đang chờ lượt...'}
        </span>
      </div>
    </div>
  );
}
