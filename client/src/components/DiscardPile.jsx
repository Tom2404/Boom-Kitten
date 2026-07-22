import React, { useState, useEffect } from 'react';
import Card, { CARD_THEMES } from './Card.jsx';
import { motion } from 'framer-motion';

export default function DiscardPile({ discardPile = [], pendingCombo5, myUserId, onSelectCard, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const isChoosing = pendingCombo5 && pendingCombo5.playerId === myUserId;

  // Last 3 cards for hover tooltip (excluding the visible top card)
  const recentCards = discardPile.length > 1 ? discardPile.slice(-4, -1).reverse() : [];

  useEffect(() => {
    if (isChoosing) {
      // Đợi hiệu ứng Combo 5 (thùng rác rơi xuống, khoảng 2.5s) kết thúc rồi mới tự động mở form
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [isChoosing]);

  const handleSelect = (cardId) => {
    onSelectCard(cardId);
    setIsOpen(false);
  };

  return (
    <div className={`game-pile game-pile--discard ${compact ? 'game-pile--compact' : ''}`} onClick={(e) => e.stopPropagation()}>
      <span className="game-pile__label">Bài đã đánh</span>

      <div
        id="discard-pile-element"
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {topCard ? (
          <motion.div
            key={topCard.id}
            initial={{ scale: 1.5, rotate: Math.random() * 40 - 20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={() => setIsOpen(true)}
            className="game-pile__discard-card"
          >
            <Card type={topCard.type} skinIndex={topCard.skinIndex ?? 0} disabled={false} compact={compact} />
          </motion.div>
        ) : (
          <div className="game-pile__empty">
            Trống
          </div>
        )}

        {/* Floating badge for pile size - black with white text */}
        {discardPile.length > 0 && (
          <div className="game-pile__count">
            {discardPile.length}
          </div>
        )}

        {/* Hover History Tooltip */}
        {isHovered && recentCards.length > 0 && !isChoosing && (
          <div className="absolute -left-2 top-full mt-2 z-50 bg-[#1a1c1c] border-2 border-white/30 p-2 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] pointer-events-none animate-fade-in min-w-[130px]">
            <div className="text-[7px] text-yellow-400 font-headline font-black uppercase tracking-wider mb-1.5 border-b border-white/20 pb-1">
              Gần đây ({discardPile.length} lá)
            </div>
            {recentCards.map((card, i) => {
              const theme = CARD_THEMES[card.type] || { name: card.type, icon: '🃏' };
              return (
                <div key={card.id || i} className="flex items-center gap-1.5 py-0.5 text-[8px] text-white/85 font-headline font-bold">
                  <span>{theme.icon}</span>
                  <span className="truncate">{theme.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Action overlay if choosing for Combo 5 */}
        {isChoosing && (
          <button
            onClick={() => setIsOpen(true)}
            className="game-pile__combo-prompt"
          >
            <span>Chọn bài · Combo 5</span>
          </button>
        )}
      </div>
 
      <button
        onClick={() => setIsOpen(true)}
        disabled={discardPile.length === 0}
        className="game-pile__hint game-pile__history"
      >
        Xem chồng bài bỏ
      </button>

      {/* Discard Pile Modal Viewer */}
      {isOpen && (() => {
        const typeCounts = discardPile.reduce((acc, card) => {
          acc[card.type] = (acc[card.type] || 0) + 1;
          return acc;
        }, {});

        const reversedPile = [...discardPile].reverse();

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 animate-fade-in text-slate-900" onClick={() => setIsOpen(false)}>
            <div className="relative w-full max-w-4xl max-h-[80vh] bg-white border-4 border-on-surface rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b-3 border-on-surface pb-3 flex-wrap gap-4">
                <div>
                  <h3 className="text-2xl font-headline font-black text-[#b7131a] uppercase">Chồng Bài Đã Đánh</h3>
                  <p className="text-xs font-bold text-on-surface-variant mt-1">
                    {isChoosing 
                      ? 'Bạn đã đánh combo 5 lá mèo khác nhau! Hãy CHỌN 1 lá bài dưới đây để lấy về tay.' 
                      : 'Danh sách các lá bài đã được đánh trong ván đấu này (Mới nhất hiển thị trước).'}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-lg bg-surface border-2 border-on-surface hover:bg-slate-100 text-on-surface flex items-center justify-center transition-all shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
                >
                  ✕
                </button>
              </div>

              {/* Statistics Bar */}
              {discardPile.length > 0 && (
                <div className="flex flex-col gap-1.5 bg-slate-50 border-3 border-on-surface p-3 rounded-2xl shadow-[2px_2px_0px_0px_#1a1c1c]">
                  <span className="text-[10px] font-headline font-black text-slate-500 uppercase tracking-wider">Thống kê bài đã đánh:</span>
                  <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar p-0.5">
                    {Object.entries(typeCounts).map(([type, count]) => {
                      const theme = CARD_THEMES[type] || { name: type, icon: '🃏', color: 'bg-slate-300 text-slate-950' };
                      return (
                        <div key={type} className={`text-[10px] font-headline font-black uppercase px-2.5 py-1 rounded-lg border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] flex items-center gap-1.5 ${theme.color}`}>
                          <span>{theme.icon}</span>
                          <span>{theme.name}: {count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Grid of Cards */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 p-2 hide-scroll">
                {reversedPile.map((card, index) => {
                  return (
                    <div
                      key={card.id || index}
                      className={`relative p-1 rounded-xl transition-all duration-100
                        ${isChoosing ? 'hover:scale-105 cursor-pointer' : ''}`}
                      onClick={isChoosing ? () => handleSelect(card.id) : undefined}
                    >
                      {/* Newest Badge for the top card (first element of reversed pile) */}
                      {index === 0 && !isChoosing && (
                        <span className="absolute -top-1.5 -left-1.5 z-10 bg-rose-600 text-white border-2 border-on-surface text-[9px] font-headline font-black px-2 py-0.5 rounded-lg shadow-[1.5px_1.5px_0px_0px_#1a1c1c] rotate-[-4deg]">
                          MỚI NHẤT
                        </span>
                      )}

                      <Card type={card.type} skinIndex={card.skinIndex ?? 0} disabled={false} hideInfo={true} />
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
        );
      })()}
    </div>
  );
}
