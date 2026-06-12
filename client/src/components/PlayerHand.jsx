import React, { useState } from 'react';
import Card from './Card.jsx';

export default function PlayerHand({ hand, onPlayCard, onPlayCombo, isMyTurn, targetPlayerId }) {
  const [selectedIds, setSelectedIds] = useState([]);

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

    // Trigger play action
    onPlayCard(card.type, targetPlayerId);
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

    // Nope can be played at any time (not just my turn)
    if (card.type === 'nope') return true;

    // Cat cards cannot be played singly
    if (card.type.startsWith('cat_')) return false;

    // Other cards require my turn
    return isMyTurn;
  };

  const isComboPlayable = () => {
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
          {isMyTurn && (
            <span className="bg-yellow-400 text-slate-950 text-xs px-3 py-0.5 rounded-full font-headline font-black border-2 border-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] animate-pulse">
              ĐẾN LƯỢT!
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
            Đánh Bài 🚀
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
        <div className="flex gap-4 overflow-x-auto pb-4 pt-6 px-2 hide-scroll max-w-full">
          {hand.map((card, index) => {
            const isSelected = selectedIds.includes(card.id);
            return (
              <div
                key={card.id || index}
                style={{ zIndex: isSelected ? 20 : 10 + index }}
                className="transform transition-transform duration-100 flex-shrink-0"
              >
                <Card
                  type={card.type}
                  selected={isSelected}
                  onClick={() => toggleSelectCard(card.id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
