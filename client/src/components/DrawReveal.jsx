import React, { useEffect } from 'react';
import Card from './Card.jsx';
import { OverlayPortal } from './ui/OverlayPortal.jsx';

export default function DrawReveal({ type, skinIndex = 0, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1000); // Auto close after 1 second

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <OverlayPortal>
      <div className="game-modal-layer fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs select-none pointer-events-none">
        <div className="draw-reveal-anim flex flex-col items-center gap-4">
        {/* Cartoon Brutalist Tag */}
        <span 
          className="bg-[#1a1c1c] text-[#facc15] font-headline font-black text-xs px-4.5 py-1.5 rounded-xl border-3 border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-[-3deg] uppercase tracking-wider text-center"
        >
          BẠN VỪA RÚT ĐƯỢC!
        </span>
        
        {/* Magnified Card Component with yellow glow */}
        <div className="scale-125 filter drop-shadow-[0_0_24px_rgba(251,191,36,0.85)]">
          <Card type={type} skinIndex={skinIndex} disabled={false} />
        </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
