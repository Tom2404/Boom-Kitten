import React, { useState } from 'react';
import Card, { CARD_THEMES } from './Card.jsx';

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
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bài Đã Đánh</span>

      <div className="relative">
        {topCard ? (
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-pointer hover:scale-102 hover:brightness-105 transition-transform"
          >
            <Card type={topCard.type} disabled={false} />
          </div>
        ) : (
          <div className="h-44 w-32 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-xs">
            Trống
          </div>
        )}

        {/* Floating badge for pile size */}
        {discardPile.length > 0 && (
          <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold font-mono text-slate-300 shadow-md">
            {discardPile.length}
          </div>
        )}

        {/* Action overlay if choosing for Combo 5 */}
        {isChoosing && (
          <button
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 rounded-xl bg-purple-500/20 border-2 border-purple-400 animate-pulse flex flex-col items-center justify-center gap-2 text-center p-2"
          >
            <span className="text-2xl">⚡</span>
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Chọn Bài (Combo 5)</span>
          </button>
        )}
      </div>

      <button
        onClick={() => setIsOpen(true)}
        disabled={discardPile.length === 0}
        className="text-[10px] text-slate-500 hover:text-slate-300 underline disabled:opacity-50 disabled:no-underline"
      >
        Xem chồng bài bỏ
      </button>

      {/* Discard Pile Modal Viewer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[80vh] bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Chồng Bài Đã Đánh</h3>
                <p className="text-xs text-slate-400">
                  {isChoosing 
                    ? 'Bạn đã đánh combo 5 lá mèo khác nhau! Hãy CHỌN 1 lá bài dưới đây để lấy về tay.' 
                    : 'Danh sách các lá bài đã được đánh trong ván đấu này.'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Grid of Cards */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 p-2">
              {discardPile.map((card, index) => {
                const theme = CARD_THEMES[card.type] || {};
                return (
                  <div
                    key={card.id || index}
                    className={`relative p-1 rounded-xl transition-all duration-300
                      ${isChoosing ? 'hover:scale-105 hover:ring-2 hover:ring-purple-400 cursor-pointer' : ''}`}
                    onClick={isChoosing ? () => handleSelect(card.id) : undefined}
                  >
                    <Card type={card.type} />
                    {isChoosing && (
                      <div className="absolute inset-0 bg-purple-500/10 hover:bg-transparent rounded-xl flex items-end justify-center pb-2 pointer-events-none">
                        <span className="bg-purple-600 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white shadow">
                          Lấy Lá Này
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer close button */}
            <div className="flex justify-end border-t border-slate-800 pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
