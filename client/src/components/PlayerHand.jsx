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

const GODCAT_TRANSFORM_TYPES = [
  { type: 'attack_2x', label: 'Tấn Công (Attack)' },
  { type: 'skip', label: 'Qua Lượt (Skip)' },
  { type: 'super_skip', label: 'Siêu Qua Lượt (Super Skip)' },
  { type: 'favor', label: 'Xin Bài (Favor)' },
  { type: 'shuffle', label: 'Tráo Bài (Shuffle)' },
  { type: 'see_the_future_3', label: 'Tiên Tri (See the Future)' },
  { type: 'alter_the_future_3', label: 'Định Đoạt (Alter the Future)' },
  { type: 'draw_from_bottom', label: 'Rút Dưới Đáy (Draw Bottom)' },
  { type: 'bury', label: 'Chôn Bài (Bury)' },
  { type: 'attack_of_the_dead', label: 'Tấn Công Xác Sống (Attack of Dead)' },
  { type: 'feed_the_dead', label: 'Nuôi Xác Sống (Feed the Dead)' },
  { type: 'grave_robber', label: 'Kẻ Trộm Mộ (Grave Robber)' },
  { type: 'clairvoyance_now', label: 'Thấu Thị (Clairvoyance)' },
  { type: 'dig_deeper', label: 'Đào Sâu (Dig Deeper)' },
  { type: 'armageddon', label: 'Tận Thế (Armageddon)' },
  { type: 'reveal_the_future_3x', label: 'Xem Trước Tương Lai (Reveal Future)' },
];

const isCatCardType = (type) => type.startsWith('cat_') || type === 'feral_cat' || type === 'godcat';

export default function PlayerHand({ 
  hand, 
  onPlayCard, 
  onPlayCombo, 
  isMyTurn, 
  targetPlayerId, 
  nopeWindowActive, 
  onDiscard, 
  maxHandSize = 10,
  players = [],
  myUserId
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [combo3Pending, setCombo3Pending] = useState(null); // { ids, targetPlayerId }
  const [combo3Step, setCombo3Step] = useState('target'); // 'target' | 'card'
  const [godcatPending, setGodcatPending] = useState(null); // { id }

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
    const clickedCard = hand.find((c) => c.id === cardId);
    if (!clickedCard) return;

    const isBlinded = hand.some((c) => c.type === 'hidden');
    if (isBlinded) {
      setSelectedIds([cardId]);
      return;
    }

    const clickedIsCat = isCatCardType(clickedCard.type);

    setSelectedIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }

      if (clickedIsCat) {
        // Filter out any non-cat cards from previous selection
        const prevCats = prev.filter(id => {
          const c = hand.find(card => card.id === id);
          return c && isCatCardType(c.type);
        });
        return [...prevCats, cardId];
      } else {
        // Action card: clear all and select only this one
        return [cardId];
      }
    });
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
      clearSelection();
    } else if (card.type === 'godcat') {
      setGodcatPending({ id: card.id });
      clearSelection();
    } else {
      // Trigger play action
      onPlayCard(card.type, targetPlayerId, { cardId: card.id });
      clearSelection();
    }
  };

  const handleGodcatTransformConfirm = (asCardType) => {
    if (!godcatPending) return;
    onPlayCard('godcat', targetPlayerId, { asCardType });
    setGodcatPending(null);
  };

  const handlePlayCombo = () => {
    if (selectedIds.length < 2) return;
    if (selectedIds.length === 3) {
      // 3-card combo: need to pick the target and card type to steal
      setCombo3Pending({ ids: selectedIds, targetPlayerId: null });
      setCombo3Step('target');
      clearSelection();
      return;
    }
    onPlayCombo(selectedIds, null);
    clearSelection();
  };

  const handleSelectTarget = (opponentId) => {
    setCombo3Pending(prev => ({ ...prev, targetPlayerId: opponentId }));
    setCombo3Step('card');
  };

  const handleCombo3StealConfirm = (stealType) => {
    if (!combo3Pending || !combo3Pending.targetPlayerId) return;
    // Send combo with targetPlayerId and stealCardType directly
    onPlayCombo(combo3Pending.ids, combo3Pending.targetPlayerId, stealType);
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

    // Treat 'godcat' as a wild card (like feral_cat) for combo validation
    const wildCount = selectedTypes.filter((t) => t === 'feral_cat' || t === 'godcat').length;
    const nonWild = selectedTypes.filter((t) => t !== 'feral_cat' && t !== 'godcat');
    const allCatsOrWild = selectedTypes.every((t) => t.startsWith('cat_') || t === 'feral_cat' || t === 'godcat');

    if (selectedIds.length === 2) {
      // 2-card combo: same cat type, OR one wild + one cat.
      // Requires a target opponent to steal from.
      if (!allCatsOrWild) return false;
      return wildCount === 2 || wildCount === 1 || (nonWild.length === 2 && nonWild[0] === nonWild[1]);
    }
    if (selectedIds.length === 3) {
      // 3-card combo: all cats, with 2+ same type (or wild filling in).
      if (!allCatsOrWild) return false;
      if (wildCount >= 2) return true;
      if (wildCount === 1 && nonWild.length === 2 && nonWild[0] === nonWild[1]) return true;
      if (wildCount === 0 && nonWild.length === 3 && nonWild[0] === nonWild[1] && nonWild[1] === nonWild[2]) return true;
      return false;
    }
    if (selectedIds.length === 5) {
      // 5-card combo: must be 5 different cat types
      const uniqueCats = new Set(selectedTypes);
      return (
        uniqueCats.size === 5 &&
        allCatsOrWild
      );
    }
    return false;
  };

  const canPerformAction = useMemo(() => {
    if (hand.length > maxHandSize) {
      return selectedIds.length === 1;
    }
    const selected = hand.filter((c) => selectedIds.includes(c.id));
    if (selected.length === 0) return false;

    const firstCard = selected[0];
    const isCat = isCatCardType(firstCard.type);

    if (isCat) {
      return isComboPlayable();
    } else {
      return isSinglePlayable();
    }
  }, [selectedIds, hand, maxHandSize, isComboPlayable, isSinglePlayable]);

  const buttonText = useMemo(() => {
    if (hand.length > maxHandSize) {
      return "Bỏ Bài";
    }
    if (selectedIds.length === 0) {
      return "Đánh Bài";
    }
    const selected = hand.filter((c) => selectedIds.includes(c.id));
    const firstCard = selected[0];
    const isCat = isCatCardType(firstCard.type);

    if (isCat) {
      return `Combo ${selected.length} Lá Mèo`;
    } else {
      return "Đánh Bài";
    }
  }, [selectedIds, hand, maxHandSize]);

  const handleButtonClick = () => {
    if (!canPerformAction) return;

    if (hand.length > maxHandSize) {
      if (selectedIds.length !== 1) return;
      if (onDiscard) onDiscard(selectedIds[0]);
      clearSelection();
    } else {
      const selected = hand.filter((c) => selectedIds.includes(c.id));
      const firstCard = selected[0];
      const isCat = isCatCardType(firstCard.type);

      if (isCat) {
        handlePlayCombo();
      } else {
        handlePlaySingle();
      }
    }
  };

  return (
    <div className={`w-full bg-white border-4 rounded-3xl p-5 flex flex-col gap-4 transition-all duration-300
      ${hand.length > maxHandSize 
        ? 'border-rose-500 shadow-[6px_6px_0px_0px_rgba(239,68,68,1)]' 
        : 'border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)]'}`}>
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
            onClick={handleButtonClick}
            disabled={!canPerformAction}
            className={`rounded-xl font-headline font-black uppercase transition-all duration-100 relative
              ${hand.length > maxHandSize
                ? 'px-7 py-2.5 text-sm bg-rose-500 text-white border-3 border-on-surface border-b-[6px] shadow-[4px_4px_0px_0px_#1a1c1c] hover:scale-105 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:border-b-3 active:shadow-none animate-bounce z-30'
                : 'btn-detonator px-5 py-1.5 text-xs'
              }`}
          >
            {buttonText}
          </button>
        </div>
      </div>

      {/* Cards List container with horizontal scrolling */}
      {hand.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-on-surface-variant text-sm border-3 border-dashed border-on-surface rounded-2xl bg-surface font-headline font-black uppercase">
          Không có lá bài nào trên tay. Hãy bốc bài!
        </div>
      ) : (() => {
        const totalCards = sortedHand.length;
        const midIndex = (totalCards - 1) / 2;
        const overlap = totalCards > 1 ? Math.min(40, 12 + (totalCards - 2) * 3) : 0;
        const justifyClass = totalCards <= 6
          ? 'justify-center'
          : (totalCards <= 11 ? 'justify-start md:justify-center' : 'justify-start');

        return (
          <div
            ref={containerRef}
            id="player-hand-container"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex ${justifyClass} overflow-x-auto pb-8 pt-12 px-6 custom-scrollbar max-w-full cursor-grab active:cursor-grabbing select-none`}
          >
            <AnimatePresence mode="popLayout">
              {sortedHand.map((card, index) => {
                const isSelected = selectedIds.includes(card.id);
                // Detect type boundary → add visual gap between groups
                const isNewGroup = index > 0 && sortedHand[index - 1].type !== card.type;

                const diff = index - midIndex;
                const maxRotation = Math.min(18, (totalCards - 1) * 2.5);
                const arcHeight = Math.min(20, (totalCards - 1) * 2.5);

                const baseRotate = totalCards > 1 ? (diff / (midIndex || 1)) * maxRotation : 0;
                const baseY = totalCards > 1 ? (Math.pow(diff, 2) / Math.pow(midIndex || 1, 2)) * arcHeight : 0;

                const cardStyle = {
                  marginLeft: index > 0 ? (isNewGroup ? `-${overlap - 16}px` : `-${overlap}px`) : '0px',
                };

                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, x: 200, y: 150, scale: 0.3, rotate: 45 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      y: isSelected ? baseY - 24 : baseY,
                      rotate: isSelected ? 0 : baseRotate,
                      scale: isSelected ? 1.05 : 1,
                      zIndex: isSelected ? 100 : 10 + index,
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
                      y: baseY - 42,
                      rotate: 0,
                      scale: 1.15,
                      zIndex: 200,
                      transition: { duration: 0.15, ease: 'easeOut' }
                    }}
                    style={cardStyle}
                    className="flex-shrink-0"
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
      );
    })()}

      {/* 3-Cat Combo: Target & Card Picker Wizard Modal */}
      {combo3Pending && (() => {
        const aliveOpponents = players.filter((p) => p.alive && p.userId !== myUserId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-6 max-w-xl w-full mx-4 flex flex-col gap-4 text-slate-900">
              {combo3Step === 'target' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-headline font-black text-primary uppercase tracking-wide">3 Mèo Combo: Bước 1</span>
                    <p className="text-xs font-bold text-slate-500">Chọn mục tiêu để lấy bài:</p>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {aliveOpponents.length === 0 ? (
                      <div className="text-center py-4 text-xs font-bold text-slate-400">Không có đối thủ nào khả dụng.</div>
                    ) : (
                      aliveOpponents.map((opp) => (
                        <button
                          key={opp.userId}
                          onClick={() => handleSelectTarget(opp.userId)}
                          className="flex items-center justify-between p-3 border-2 border-on-surface rounded-xl bg-surface hover:bg-yellow-50/50 transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 border border-on-surface flex items-center justify-center text-xs font-headline font-black uppercase text-indigo-700 animate-pulse">
                              {opp.username ? opp.username.slice(0, 2).toUpperCase() : opp.userId.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-headline font-black text-on-surface uppercase">{opp.username || opp.userId}</span>
                              <span className="text-[9px] font-bold text-slate-400">{opp.handCount} lá bài</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg uppercase">Chọn</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-headline font-black text-primary uppercase tracking-wide">3 Mèo Combo: Bước 2</span>
                    <p className="text-xs font-bold text-slate-500">
                      Chọn loại bài muốn lấy từ <span className="text-indigo-600 font-bold uppercase">{players.find(p => p.userId === combo3Pending.targetPlayerId)?.username || 'đối thủ'}</span>:
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {CAT_TYPES.map((ct) => (
                      <div
                        key={ct.type}
                        onClick={() => handleCombo3StealConfirm(ct.type)}
                        className="group flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-on-surface bg-white shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-[1.03] hover:bg-yellow-50/50 transition-all cursor-pointer select-none"
                      >
                        <div className="scale-90 pointer-events-none origin-center mb-1">
                          <Card type={ct.type} compact={true} disabled={true} />
                        </div>
                        <span className="text-[10px] font-headline font-black text-on-surface uppercase group-hover:text-primary transition-colors text-center px-1">
                          {ct.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-between items-center mt-2 gap-3">
                {combo3Step === 'card' && (
                  <button
                    onClick={() => setCombo3Step('target')}
                    className="px-4 py-2 text-xs font-headline font-black border-2 border-on-surface rounded-xl bg-slate-100 hover:bg-slate-200 transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase"
                  >
                    Quay lại
                  </button>
                )}
                <button
                  onClick={() => setCombo3Pending(null)}
                  className="px-4 py-2 text-xs font-headline font-black border-2 border-on-surface rounded-xl bg-white hover:bg-red-50 text-red-600 border-red-600 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(220,38,38,1)] uppercase ml-auto"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Godcat transformation: Card Type Picker Modal */}
      {godcatPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-slate-900">
              <span className="text-sm font-headline font-black text-primary uppercase tracking-wide">Hóa Thân Godcat</span>
              <p className="text-xs font-bold text-on-surface-variant">Chọn loại chức năng bạn muốn hóa thân thành:</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {GODCAT_TRANSFORM_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => handleGodcatTransformConfirm(ct.type)}
                  className="px-3 py-2.5 text-xs font-headline font-black border-2 border-on-surface rounded-xl bg-surface hover:bg-primary hover:text-on-primary transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none uppercase text-left text-slate-900"
                >
                  {ct.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setGodcatPending(null)}
              className="px-4 py-2 text-xs font-headline font-black border-2 border-on-surface rounded-xl bg-surface hover:bg-slate-100 transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase text-slate-900"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
