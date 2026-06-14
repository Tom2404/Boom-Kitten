import React, { useState, useRef } from 'react';
import Card from './Card.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerHand({ hand, onPlayCard, onPlayCombo, isMyTurn, targetPlayerId, nopeWindowActive, onDiscard, maxHandSize = 10 }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const containerRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);
  const hasDragged = useRef(false);

  const handleMouseDown = (e) => {
    isDown.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftVal.current = containerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeftVal.current - walk;
    if (Math.abs(x - startX.current) > 5) {
      hasDragged.current = true;
    }
  };

  const toggleSelectCard = (cardId) => {
    setSelectedIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const getSelectedCards = () => {
    return hand.filter((c) => selectedIds.includes(c.id));
  };

  const handlePlaySingle = () => {
    if (selectedIds.length !== 1) return;
    const card = hand.find((c) => c.id === selectedIds[0]);
    if (!card) return;

    if (hand.length > maxHandSize) {
      if (onDiscard) onDiscard(card.id);
    } else {
      // Trigger play action
      onPlayCard(card.type, targetPlayerId);
    }
    clearSelection();
  };

  const handlePlayCombo = () => {
    if (selectedIds.length < 2) return;
    onPlayCombo(selectedIds, targetPlayerId);
    clearSelection();
  };

  const selectedCards = getSelectedCards();
  const selectedTypes = selectedCards.map((c) => c.type);

  // Validation logic
  const isSinglePlayable = () => {
    if (selectedIds.length !== 1) return false;
    const card = selectedCards[0];
    if (!card) return false;

    // If they have too many cards, they can discard any card
    if (hand.length > maxHandSize) return true;

    // Nope can be played at any time (not just my turn)
    if (card.type === 'nope') return true;

    // If Nope window is active, cannot play other cards
    if (nopeWindowActive) return false;

    // Cat cards cannot be played singly
    if (card.type.startsWith('cat_')) return false;

    // Other cards require my turn
    return isMyTurn;
  };

  const isComboPlayable = () => {
    if (hand.length > maxHandSize) return false; // Must discard first, no combos
    if (nopeWindowActive) return false; // No combos during Nope window
    if (selectedIds.length === 2) {
      // 2-card combo: must be same cat type
      return selectedTypes[0] === selectedTypes[1] && selectedTypes[0].startsWith('cat_') && isMyTurn;
    }
    if (selectedIds.length === 5) {
      // 5-card combo: must be 5 different cat types
      const uniqueCats = new Set(selectedTypes);
      return (
        uniqueCats.size === 5 &&
        selectedTypes.every((t) => t.startsWith('cat_')) &&
        isMyTurn
      );
    }
    return false;
  };

  return (
    <div className="w-full bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-5 flex flex-col gap-4">
      {/* Control Actions Bar */}
      <div className="flex justify-between items-center border-b-3 border-on-surface pb-3 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-headline font-black text-on-surface uppercase">BÀI CỦA BẠN</span>
          <span className="bg-primary-fixed text-xs px-2.5 py-0.5 rounded-full text-on-surface border-2 border-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] font-headline font-black">
            {hand.length} lá
          </span>
          {isMyTurn && hand.length <= maxHandSize && (
            <span className="bg-yellow-400 text-slate-950 text-xs px-3 py-0.5 rounded-full font-headline font-black border-2 border-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] animate-pulse">
              ĐẾN LƯỢT!
            </span>
          )}
          {hand.length > maxHandSize && (
            <span className="bg-rose-500 text-white text-xs px-3 py-0.5 rounded-full font-headline font-black border-2 border-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] animate-pulse">
              BẮT BUỘC HỦY BÀI (&gt;{maxHandSize} LÁ)!
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="px-4 py-1.5 rounded-xl text-xs bg-surface border-2 border-on-surface hover:bg-slate-100 font-headline font-black uppercase shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
            >
              Hủy Chọn ({selectedIds.length})
            </button>
          )}

          <button
            onClick={handlePlaySingle}
            disabled={!isSinglePlayable()}
            className="btn-detonator px-5 py-1.5 rounded-xl text-xs font-headline font-black uppercase shadow-[2px_2px_0px_0px_#1a1c1c]"
          >
            {hand.length > maxHandSize ? "Bỏ Bớt Bài 🗑️" : "Đánh Bài 🚀"}
          </button>

          <button
            onClick={handlePlayCombo}
            disabled={!isComboPlayable()}
            className="btn-detonator px-5 py-1.5 rounded-xl text-xs font-headline font-black uppercase bg-indigo-400 text-slate-950 shadow-[2px_2px_0px_0px_#1a1c1c]"
          >
            Đánh Combo ({selectedIds.length}) 🤝
          </button>
        </div>
      </div>

      {/* Cards List container with horizontal scrolling */}
      {hand.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-on-surface-variant text-sm border-3 border-dashed border-on-surface rounded-2xl bg-surface font-headline font-black uppercase">
          Không có lá bài nào trên tay. Hãy bốc bài!
        </div>
      ) : (
        <div
          ref={containerRef}
          id="player-hand-container"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex gap-4 overflow-x-auto pb-4 pt-6 px-2 custom-scrollbar max-w-full cursor-grab active:cursor-grabbing select-none"
        >
          <AnimatePresence mode="popLayout">
            {hand.map((card, index) => {
              const isSelected = selectedIds.includes(card.id);
              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, x: 200, y: 150, scale: 0.3, rotate: 45 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotate: 0,
                    transition: { type: 'spring', stiffness: 150, damping: 18 }
                  }}
                  exit={{
                    opacity: 0,
                    y: -100,
                    scale: 0.5,
                    rotate: -15,
                    transition: { duration: 0.2 }
                  }}
                  whileHover={{
                    y: isSelected ? -20 : -4,
                    scale: 1.02,
                    transition: { duration: 0.1 }
                  }}
                  style={{ zIndex: isSelected ? 20 : 10 + index }}
                  className="flex-shrink-0"
                >
                  <Card
                    type={card.type}
                    selected={isSelected}
                    marked={card.marked}
                    onClick={() => {
                      if (!hasDragged.current) {
                        toggleSelectCard(card.id);
                      }
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
