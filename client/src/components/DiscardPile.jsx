import React, { useState } from 'react';
import Card, { CARD_THEMES } from './Card.jsx';
import { motion } from 'framer-motion';

export default function DiscardPile({ discardPile = [], pendingCombo5, myUserId, onSelectCard }) {
  const [isOpen, setIsOpen] = useState(false);

  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const isChoosing = pendingCombo5 && pendingCombo5.playerId === myUserId;

  const handleSelect = (cardId) => {
    onSelectCard(cardId);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-headline font-black text-white uppercase tracking-wider bg-on-background px-3 py-0.5 rounded-lg border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] rotate-[2deg]">BÀI ĐÃ ĐÁNH</span>

      <div id="discard-pile-element" className="relative">
        {topCard ? (
          <motion.div
            key={topCard.id}
            initial={{ scale: 1.5, rotate: Math.random() * 40 - 20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={() => setIsOpen(true)}
            className="cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <Card type={topCard.type} disabled={false} />
          </motion.div>
        ) : (
          <div className="h-44 w-32 rounded-xl border-3 border-dashed border-on-surface flex items-center justify-center text-white/50 text-xs bg-white/5 font-headline font-black uppercase shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
            Trống
          </div>
        )}

        {/* Floating badge for pile size */}
        {discardPile.length > 0 && (
          <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-yellow-400 border-3 border-on-surface flex items-center justify-center text-xs font-headline font-black text-slate-950 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
            {discardPile.length}
          </div>
        )}

        {/* Action overlay if choosing for Combo 5 */}
        {isChoosing && (
          <button
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 rounded-xl bg-purple-500/30 border-3 border-purple-500 animate-pulse flex flex-col items-center justify-center gap-2 text-center p-2"
          >
            <span className="text-3xl">⚡</span>
            <span className="text-[10px] font-headline font-black text-white uppercase tracking-wider bg-purple-600 px-2 py-0.5 rounded border border-on-surface shadow">Chọn Bài (Combo 5)</span>
          </button>
        )}
      </div>

      <button
        onClick={() => setIsOpen(true)}
        disabled={discardPile.length === 0}
        className="text-[10px] font-headline font-black text-slate-400 hover:text-white underline disabled:opacity-50 disabled:no-underline uppercase mt-1"
      >
        Xem chồng bài bỏ 👁️
      </button>

      {/* Discard Pile Modal Viewer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[80vh] bg-white border-4 border-on-surface rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] flex flex-col gap-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b-3 border-on-surface pb-3 flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-headline font-black text-primary uppercase">Chồng Bài Đã Đánh</h3>
                <p className="text-xs font-bold text-on-surface-variant mt-1">
                  {isChoosing 
                    ? 'Bạn đã đánh combo 5 lá mèo khác nhau! Hãy CHỌN 1 lá bài dưới đây để lấy về tay.' 
                    : 'Danh sách các lá bài đã được đánh trong ván đấu này.'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg bg-surface border-2 border-on-surface hover:bg-slate-100 text-on-surface flex items-center justify-center transition-all shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Grid of Cards */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 p-2 hide-scroll">
              {discardPile.map((card, index) => {
                return (
                  <div
                    key={card.id || index}
                    className={`relative p-1 rounded-xl transition-all duration-100
                      ${isChoosing ? 'hover:scale-105 cursor-pointer' : ''}`}
                    onClick={isChoosing ? () => handleSelect(card.id) : undefined}
                  >
                    <Card type={card.type} disabled={true} />
                    {isChoosing && (
                      <div className="absolute inset-0 bg-purple-500/10 hover:bg-transparent rounded-xl flex items-end justify-center pb-4 pointer-events-none">
                        <span className="bg-purple-600 text-[9px] font-headline font-black uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-[1.5px_1.5px_0px_0px_#1a1c1c] border border-on-surface">
                          Lấy Lá Này
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
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
