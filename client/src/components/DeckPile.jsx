import React from 'react';

export default function DeckPile({ count, onDraw, isMyTurn, disabled }) {
  const handleDraw = () => {
    if (isMyTurn && !disabled) {
      onDraw();
    }
  };

  const isClickable = isMyTurn && !disabled;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bài Bốc</span>
      
      <div
        onClick={handleDraw}
        className={`relative h-44 w-32 rounded-xl border-2 bg-gradient-to-br from-indigo-700 to-slate-900 shadow-xl flex flex-col items-center justify-center p-3 transition-all duration-300 select-none
          ${isClickable 
            ? 'cursor-pointer border-indigo-400 hover:scale-105 hover:-translate-y-2 hover:shadow-indigo-500/20 active:scale-95' 
            : 'border-slate-800 cursor-not-allowed opacity-85'}`}
      >
        {/* Card Back Design */}
        <div className="absolute inset-1.5 border border-dashed border-indigo-500/30 rounded-lg flex flex-col items-center justify-center">
          {/* Neon paw icon or symbol */}
          <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">🐾</span>
          <span className="mt-2 text-xs font-bold text-indigo-300 font-mono tracking-widest uppercase">Mèo Nổ</span>
        </div>

        {/* Floating badge for card count */}
        <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-indigo-500 border-2 border-slate-950 flex items-center justify-center text-xs font-bold font-mono text-white shadow-md">
          {count}
        </div>

        {/* Glow overlay for clickable */}
        {isClickable && (
          <div className="absolute inset-0 rounded-xl bg-indigo-500/5 animate-pulse pointer-events-none" />
        )}
      </div>

      <span className="text-[10px] text-slate-500 text-center max-w-[130px] leading-tight">
        {isClickable ? 'Bấm vào để bốc bài và kết thúc lượt!' : 'Chưa đến lượt của bạn'}
      </span>
    </div>
  );
}
