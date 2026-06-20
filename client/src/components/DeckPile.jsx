import React, { useState } from 'react';
import Card from './Card.jsx';

export default function DeckPile({ count, topCard, onDraw, isMyTurn, disabled, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);

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
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="text-[10px] font-headline font-black text-slate-400 hover:text-white underline uppercase mt-1"
        >
          Xem xấp bài bốc
        </button>
      </div>

      {/* Deck Pile Modal Viewer */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 animate-fade-in text-slate-900">
          <div className="relative w-full max-w-4xl max-h-[80vh] bg-white border-4 border-on-surface rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b-3 border-on-surface pb-3 flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-headline font-black text-[#b7131a] uppercase">Danh sách bài bốc</h3>
                <p className="text-xs font-bold text-on-surface-variant mt-1">
                  Đang hiển thị các lá bài trong xấp bài bốc. (Bài được úp để đảm bảo tính công bằng của trận đấu)
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg bg-surface border-2 border-on-surface hover:bg-slate-100 text-on-surface flex items-center justify-center transition-all shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Grid of Cards (Face-down) */}
            <div className="flex-grow overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 p-2 hide-scroll">
              {Array.from({ length: count }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 p-2 bg-slate-50 border-2 border-on-surface rounded-2xl shadow-[2.5px_2.5px_0px_0px_#1a1c1c]"
                >
                  {index === 0 && topCard && topCard.faceUp ? (
                    <div className="relative h-36 w-28 scale-[0.9] overflow-visible flex items-center justify-center bg-transparent">
                      <Card type={topCard.type} disabled={true} compact={true} />
                    </div>
                  ) : (
                    <div className="relative h-36 w-28 rounded-xl border-3 border-on-surface bg-[#b7131a] flex flex-col items-center justify-center select-none">
                      <div className="absolute inset-1.5 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center bg-[#b7131a]">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                          <path d="M12 2l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <span className="text-[9px] font-headline font-black text-on-surface uppercase">
                    {index === 0 ? 'Lá trên cùng' : index === count - 1 ? 'Lá dưới đáy' : `Lá bài #${index + 1}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer close button */}
            <div className="flex justify-end border-t-3 border-on-surface pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="btn-detonator px-6 py-2 rounded-xl text-xs font-headline font-black uppercase"
              >
                Đóng ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
