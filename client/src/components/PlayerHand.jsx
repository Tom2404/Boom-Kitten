import React, { useState, useRef, useMemo } from 'react';
import Card from './Card.jsx';
import { motion, AnimatePresence } from 'framer-motion';

// Priority order for auto-sort: low number = high priority = leftmost in hand.
// Same-type cards share the same priority so they cluster naturally.
const CARD_PRIORITY = {
  defuse: 1,
  streaking_kitten: 2,
  nope: 3,
  attack_2x: 4,
  target_attack_2x: 5,
  personal_attack: 6,
  skip: 7,
  super_skip: 8,
  reverse: 9,
  see_the_future_5: 10,
  see_the_future_3: 11,
  see_the_future_1: 12,
  alter_the_future_5: 13,
  alter_the_future_3: 14,
  alter_the_future_3_now: 15,
  share_the_future_3: 16,
  shuffle: 17,
  shuffle_now: 18,
  draw_from_bottom: 19,
  favor: 20,
  ill_take_that: 21,
  bury: 22,
  swap_top_and_bottom: 23,
  catomic_bomb: 24,
  mark: 25,
  garbage_collection: 26,
  pot_luck: 27,
  clairvoyance_now: 28,
  feral_cat: 40,
  cat_taco: 41,
  cat_watermelon: 42,
  cat_beard: 43,
  cat_rainbow: 44,
  cat_potato: 45,
};
const DEFAULT_PRIORITY = 50;

const CAT_TYPES = [
  { type: 'cat_taco', label: 'Taco Cat' },
  { type: 'cat_watermelon', label: 'Watermelon Cat' },
  { type: 'cat_potato', label: 'Hairy Potato Cat' },
  { type: 'cat_beard', label: 'Beard Cat' },
  { type: 'cat_rainbow', label: 'Rainbow Ralphing Cat' },
  { type: 'feral_cat', label: 'Feral Cat' },
  { type: 'attack', label: 'Attack' },
  { type: 'skip', label: 'Skip' },
  { type: 'favor', label: 'Favor' },
  { type: 'shuffle', label: 'Shuffle' },
  { type: 'see_the_future', label: 'See the Future' },
  { type: 'nope', label: 'Nope' },
  { type: 'defuse', label: 'Defuse' },
];

export default function PlayerHand({ hand, onPlayCard, onPlayCombo, isMyTurn, targetPlayerId, nopeWindowActive, onDiscard, maxHandSize = 10 }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [combo3Pending, setCombo3Pending] = useState(null); // { ids, targetPlayerId }

  const containerRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);
  const hasDragged = useRef(false);

  // Auto-sort hand by priority; same type cards cluster together.
  const sortedHand = useMemo(() =>
    [...hand].sort((a, b) => {
      const pa = CARD_PRIORITY[a.type] ?? DEFAULT_PRIORITY;
      const pb = CARD_PRIORITY[b.type] ?? DEFAULT_PRIORITY;
      if (pa !== pb) return pa - pb;
      // Secondary: stable alphabetical within same priority bucket
      return a.type.localeCompare(b.type);
    }),
    [hand]
  );

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
    if (selectedIds.length === 3) {
      // 3-card combo: need to pick the card type to steal
      setCombo3Pending({ ids: selectedIds });
      clearSelection();
      return;
    }
    onPlayCombo(selectedIds, null);
    clearSelection();
  };

  const handleCombo3StealConfirm = (stealType) => {
    if (!combo3Pending) return;
    // Send combo with stealCardType in options via a custom event
    // Target will be selected after playing via SelectTargetModal
    onPlayCombo(combo3Pending.ids, null, stealType);
    setCombo3Pending(null);
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

    // Nope cannot be played manually — only through Nope window chain
    if (card.type === 'nope') return false;
    // Defuse cannot be played manually — auto-played when drawing Exploding Kitten
    if (card.type === 'defuse') return false;

    // "Now" cards can be played at any time (not just my turn, even during a nope window)
    const isNow = card.type.endsWith('_now');
    if (isNow) return true;

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
    if (!isMyTurn) return false;
    if (selectedIds.length === 2) {
      // 2-card combo: same cat type, OR one feral + one cat.
      // Requires a target opponent to steal from.
      const nonFeral = selectedTypes.filter((t) => t !== 'feral_cat');
      const feral = selectedTypes.filter((t) => t === 'feral_cat').length;
      const allCats = selectedTypes.every((t) => t.startsWith('cat_') || t === 'feral_cat');
      if (!allCats) return false;
      return feral === 2 || feral === 1 || (nonFeral.length === 2 && nonFeral[0] === nonFeral[1]);
    }
    if (selectedIds.length === 3) {
      // 3-card combo: all cats, with 2+ same type (or feral filling in).
      const nonFeral = selectedTypes.filter((t) => t !== 'feral_cat');
      const feral = selectedTypes.filter((t) => t === 'feral_cat').length;
      const allCats = selectedTypes.every((t) => t.startsWith('cat_') || t === 'feral_cat');
      if (!allCats) return false;
      if (feral >= 2) return true;
      if (feral === 1 && nonFeral.length === 2 && nonFeral[0] === nonFeral[1]) return true;
      if (feral === 0 && nonFeral.length === 3 && nonFeral[0] === nonFeral[1] && nonFeral[1] === nonFeral[2]) return true;
      return false;
    }
    if (selectedIds.length === 5) {
      // 5-card combo: must be 5 different cat types
      const uniqueCats = new Set(selectedTypes);
      return (
        uniqueCats.size === 5 &&
        selectedTypes.every((t) => t.startsWith('cat_') || t === 'feral_cat')
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

        <div className="flex gap-2 items-center flex-wrap">

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
            {hand.length > maxHandSize ? "Bỏ Bớt Bài 🗑️" : "Đánh Bài"}
          </button>

          <button
            onClick={handlePlayCombo}
            disabled={!isComboPlayable()}
            className="btn-detonator px-5 py-1.5 rounded-xl text-xs font-headline font-black uppercase bg-indigo-400 text-slate-950 shadow-[2px_2px_0px_0px_#1a1c1c]"
          >
            Combo ({selectedIds.length}) Mèo
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
            {sortedHand.map((card, index) => {
              const isSelected = selectedIds.includes(card.id);
              // Detect type boundary → add visual gap between groups
              const isNewGroup = index > 0 && sortedHand[index - 1].type !== card.type;
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
                  className={`flex-shrink-0${isNewGroup ? ' ml-4' : ''}`}
                >
                  <Card
                    type={card.type}
                    skinIndex={card.skinIndex ?? 0}
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

      {/* 3-Cat Combo: Card Type Picker Modal */}
      {combo3Pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-headline font-black text-on-surface uppercase tracking-wide">3 Mèo Combo</span>
              <p className="text-xs font-bold text-on-surface-variant">Chọn loại bài muốn lấy từ đối thủ:</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {CAT_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => handleCombo3StealConfirm(ct.type)}
                  className="px-3 py-2.5 text-xs font-headline font-black border-2 border-on-surface rounded-xl bg-surface hover:bg-primary hover:text-on-primary transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none uppercase text-left"
                >
                  {ct.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCombo3Pending(null)}
              className="px-4 py-2 text-xs font-headline font-black border-2 border-on-surface rounded-xl bg-surface hover:bg-slate-100 transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
