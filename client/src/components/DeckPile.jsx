import React from 'react';

export default function DeckPile({ count, onDraw, isMyTurn, disabled, compact = false }) {
  const handleDraw = () => {
    if (isMyTurn && !disabled) {
      onDraw();
    }
  };

  const isClickable = isMyTurn && !disabled;

  const sizeClass = compact ? 'h-36 w-28' : 'h-44 w-32';
  const innerTextClass = compact ? 'text-[9px]' : 'text-[10px]';
  const iconClass = compact ? 'text-3xl' : 'text-4xl';

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-headline font-black text-white uppercase tracking-wider bg-on-background px-3 py-0.5 rounded-lg border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] rotate-[-2deg]">BÀI BỐC</span>
      
      <div
        id="deck-pile-element"
        onClick={handleDraw}
        className={`relative ${sizeClass} rounded-xl border-3 border-on-surface bg-primary-container flex flex-col items-center justify-center p-3 select-none transition-all duration-100
          ${isClickable 
            ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]' 
            : 'border-slate-800 cursor-not-allowed opacity-80 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]'}`}
      >
        {/* Stack effect */}
        {count > 1 && (
          <div className="absolute inset-0 bg-primary-container border-3 border-on-surface rounded-xl translate-x-1.5 translate-y-1.5 -z-10" />
        )}
        {count > 2 && (
          <div className="absolute inset-0 bg-primary-container border-3 border-on-surface rounded-xl translate-x-3 translate-y-3 -z-20" />
        )}

        <div className="absolute inset-1.5 border-2 border-dashed border-on-primary-container/30 rounded-lg flex flex-col items-center justify-center">
          <span className={iconClass}>🐾</span>
          <span className={`mt-2 ${innerTextClass} font-headline font-black text-on-primary-container tracking-wider uppercase`}>MÈO NỔ</span>
        </div>

        {/* Floating badge for card count */}
        <div className="absolute -top-3.5 -right-3.5 h-9 w-9 rounded-full bg-yellow-400 border-3 border-on-surface flex items-center justify-center text-xs font-headline font-black text-slate-950 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
          {count}
        </div>
      </div>

      <span className="text-[9px] font-headline font-black text-slate-400 text-center max-w-[120px] leading-tight uppercase mt-1">
        {isClickable ? 'Bốc bài để hết lượt!' : 'Đang chờ lượt...'}
      </span>
    </div>
  );
}
