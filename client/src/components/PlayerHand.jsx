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
    <div className="w-full bg-slate-900/60 backdrop-blur rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Control Actions Bar */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">Bài Trên Tay</span>
          <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-300 font-mono">
            {hand.length} lá
          </span>
          {isMyTurn && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2.5 py-0.5 rounded-full font-medium border border-green-500/30 animate-pulse">
              Lượt Của Bạn
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Hủy Chọn ({selectedIds.length})
            </button>
          )}

          <button
            onClick={handlePlaySingle}
            disabled={!isSinglePlayable()}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-300
              ${isSinglePlayable()
                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 active:scale-95 shadow-yellow-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'}`}
          >
            Đánh Bài
          </button>

          <button
            onClick={handlePlayCombo}
            disabled={!isComboPlayable()}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-300
              ${isComboPlayable()
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white active:scale-95 shadow-purple-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'}`}
          >
            Đánh Combo ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Cards List container with horizontal scrolling */}
      {hand.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
          Bạn không có lá bài nào trên tay. Bốc bài để bắt đầu!
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-6 px-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {hand.map((card, index) => {
            const isSelected = selectedIds.includes(card.id);
            // Disable cards that cannot be played (like other cards when not my turn, except nope)
            // But let user select them for combos anyway!
            return (
              <div
                key={card.id || index}
                style={{ zIndex: isSelected ? 20 : 10 + index }}
                className="transform transition-transform duration-300"
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
