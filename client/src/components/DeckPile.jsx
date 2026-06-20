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

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-headline font-black text-white uppercase tracking-wider bg-on-background px-3 py-0.5 rounded-lg border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] rotate-[-2deg]">BÀI BỐC</span>
      
      <div
        id="deck-pile-element"
        onClick={handleDraw}
        className={`relative ${sizeClass} select-none transition-all duration-100 rounded-xl
          ${hasFaceUpCard 
            ? 'bg-transparent border-0 ' + (isClickable 
                ? 'cursor-pointer hover:-translate-y-2' 
                : 'cursor-pointer hover:-translate-y-1')
            : 'border-3 border-on-surface bg-[#b7131a] p-3 ' + (isClickable 
                ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]' 
                : 'border-slate-800 cursor-pointer hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]')}`}
      >
        {/* Stack effect */}
        {count > 1 && (
          <div className="absolute inset-0 bg-[#b7131a] border-3 border-on-surface rounded-xl translate-x-1.5 translate-y-1.5 -z-10" />
        )}
        {count > 2 && (
          <div className="absolute inset-0 bg-[#b7131a] border-3 border-on-surface rounded-xl translate-x-3 translate-y-3 -z-20" />
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
      </div>

      <div className="flex flex-col items-center">
        <span className="text-[9px] font-headline font-black text-slate-400 text-center max-w-[120px] leading-tight uppercase mt-1">
          {isClickable ? 'Bốc bài để hết lượt!' : 'Đang chờ lượt...'}
        </span>
      </div>
    </div>
  );
}
