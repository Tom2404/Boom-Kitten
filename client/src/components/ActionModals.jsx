import React, { useState, useEffect } from 'react';
import Card from './Card.jsx';
import { CheckIcon } from './Icons.jsx';
import { ImageButton } from './ui/ImageButton.jsx';
import { IconButton } from './ui/IconButton.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { CARD_THEMES } from './Card.jsx';
import { OverlayPortal } from './ui/OverlayPortal.jsx';

// ==========================================
// NEO-BRUTALIST MODAL WRAPPER (WITH TIMING CURVES)
// ==========================================
export function BrutalModal({ children, isOpen, onClose, maxWidth = 'max-w-xl', theme = 'light' }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = (callback) => {
    setIsClosing(true);
    setTimeout(() => {
      if (typeof callback === 'function') {
        callback();
      } else if (onClose) {
        onClose();
      }
    }, 180);
  };

  if (!isOpen) return null;

  const shellBg = theme === 'dark' ? 'neo-brutal-modal-dark' : 'neo-brutal-modal-light';

  return (
    <OverlayPortal>
      <div className={`game-modal-layer fixed inset-0 z-[10000] flex items-center justify-center p-4 ${isClosing ? 'backdrop-blur-close-anim' : 'backdrop-blur-open-anim'}`} role="presentation">
        <div className={`w-full ${maxWidth} neo-brutal-modal ${shellBg} p-6 md:p-8 flex flex-col items-center gap-6 text-center ${isClosing ? 'modal-exit-anim' : 'modal-entrance-anim'}`} role="dialog" aria-modal="true">
          {children(handleClose)}
        </div>
      </div>
    </OverlayPortal>
  );
}

// ==========================================
// 1. SEE THE FUTURE MODAL
// ==========================================
export function SeeFutureModal({ cards, onClose }) {
  if (!cards) return null;

  return (
    <BrutalModal isOpen={true} onClose={onClose} maxWidth="max-w-xl">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-primary flex items-center justify-center gap-2 uppercase">
              Tiên Tri (See the Future)
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Đây là {cards.length} lá bài trên cùng bộ bài bốc (từ trái qua phải - từ trên xuống dưới).
            </p>
          </div>

          <div className="flex gap-6 justify-center items-center py-4 flex-wrap">
            {cards.map((card, index) => (
              <div key={card.id || index} className="relative group">
                <Card type={card.type} skinIndex={card.skinIndex ?? 0} disabled={true} />
                <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-950 font-headline font-black text-[9px] px-2.5 py-0.5 rounded-none border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase">
                  Thứ {index + 1}
                </span>
              </div>
            ))}
          </div>

          <ImageButton variant="danger"
            onClick={() => closeModal()}
            className=" px-8 py-3 rounded-none font-headline font-black uppercase text-sm "
          >
            Xong, tôi đã nhớ
          </ImageButton>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 2. ALTER THE FUTURE MODAL
// ==========================================
export function AlterFutureModal({ cards, onConfirm }) {
  if (!cards || cards.length === 0) return null;

  const [order, setOrder] = useState([...cards]);

  const moveLeft = (index) => {
    if (index === 0) return;
    const copy = [...order];
    [copy[index], copy[index - 1]] = [copy[index - 1], copy[index]];
    setOrder(copy);
  };

  const moveRight = (index) => {
    if (index === order.length - 1) return;
    const copy = [...order];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    setOrder(copy);
  };

  return (
    <BrutalModal isOpen={true} onClose={() => onConfirm(order.map(c => c.id))} maxWidth="max-w-2xl">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-primary flex items-center justify-center gap-2 uppercase">
              Định Đoạt (Alter the Future)
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Thay đổi thứ tự 3 lá bài trên cùng bộ bài bốc. Sắp xếp từ trái qua phải (lá đầu tiên nằm bên trái).
            </p>
          </div>

          <div className="flex gap-4 sm:gap-6 justify-center items-stretch py-4 flex-wrap">
            {order.map((card, index) => (
              <div key={card.id || index} className="flex flex-col items-center gap-3 bg-white border-2 border-slate-900 p-4 rounded-none shadow-[3px_3px_0px_0px_#0f0f0f]">
                <span className="text-[10px] font-headline font-black text-primary uppercase">
                  {index === 0 ? 'Trên Cùng (Top)' : `Vị trí ${index + 1}`}
                </span>
                
                <Card type={card.type} skinIndex={card.skinIndex ?? 0} disabled={true} />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => moveLeft(index)}
                    disabled={index === 0}
                    className="px-3 py-1 bg-white border-2 border-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-xs rounded-none font-bold text-slate-900 transition-all shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => moveRight(index)}
                    disabled={index === order.length - 1}
                    className="px-3 py-1 bg-white border-2 border-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-xs rounded-none font-bold text-slate-900 transition-all shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
                  >
                    ▶
                  </button>
                </div>
              </div>
            ))}
          </div>

          <ImageButton variant="danger"
            onClick={() => closeModal()}
            className=" px-8 py-3 rounded-none font-headline font-black uppercase text-sm "
          >
            Lưu & Sắp Xếp Lại
          </ImageButton>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 3. FAVOR REQUEST MODAL
// ==========================================
export function FavorRequestModal({ fromPlayerId, fromPlayerName, hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-3xl">
      {(closeModal) => (
        <>
          <div className="text-center">
            <h3 className="text-2xl font-headline font-black text-primary uppercase">Bị Xin Bài! (Favor Request)</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Người chơi <strong className="text-slate-950 uppercase">{fromPlayerName || fromPlayerId}</strong> đã đánh lá Favor nhắm vào bạn. Hãy chọn 1 lá để trao cho họ.
            </p>
          </div>

          <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-start md:justify-center max-w-full custom-scrollbar px-4">
            {hand.map((card) => {
              const isSelected = selectedId === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedId(card.id)}
                  className="transform transition-transform cursor-pointer flex-shrink-0"
                >
                  <Card type={card.type} skinIndex={card.skinIndex ?? 0} selected={isSelected} />
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-2">
            <button
              onClick={() => closeModal(() => onRespond(selectedId))}
              disabled={!selectedId}
              className={`btn-detonator px-8 py-3 rounded-none font-headline font-black uppercase text-sm
                ${!selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              Gửi Lá Bài Đã Chọn
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 4. NOPE COUNTDOWN DISPLAY
// ==========================================
export function NopeCountdown({ 
  eventId, 
  timeoutMs, 
  hasNopeCard, 
  onPlayNope, 
  onPass, 
  canRespond = true,
  actingPlayerName, 
  cardType, 
  targetPlayerName, 
  nopeCount,
  isNowOnly = false,
  hand = [],
  onPlayNow
}) {
  const [timeLeft, setTimeLeft] = useState(timeoutMs);
  const { t } = useLanguage();

  useEffect(() => {
    setTimeLeft(timeoutMs);
  }, [eventId, timeoutMs]);

  useEffect(() => {
    const step = 50;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, step);

    return () => clearInterval(timer);
  }, [eventId, timeoutMs]);

  const percentage = (timeLeft / timeoutMs) * 100;
  const isCanceled = nopeCount % 2 === 1;
  const isCounterNope = nopeCount > 0;

  const NOPEABLE_ACTIONS = [
    'attack_2x', 'personal_attack_2x', 'target_attack_2x', 'attack_of_the_dead',
    'skip', 'super_skip',
    'see_the_future_1', 'see_the_future_3', 'see_the_future_5', 'see_the_future_3_now', 'reveal_the_future',
    'alter_the_future_3', 'alter_the_future_5', 'alter_the_future_3_now',
    'favor', 'garbage', 'pot_luck',
    'shuffle', 'shuffle_now',
    'swap_top_and_bottom_now',
    'feed_the_dead',
    'grave_robber',
    'dig_deeper',
    'armageddon',
    'nope'
  ];

  const isNopeable = cardType && (NOPEABLE_ACTIONS.includes(cardType) || cardType.startsWith('combo_'));
  const canNope = canRespond && !isNowOnly && hasNopeCard && isNopeable;

  const getCardDisplayName = (type) => {
    if (!type) return '';
    const clean = type.replace('discard_', '');
    const key = `card_${clean}_name`;
    const translated = t(key);
    if (translated !== key) return translated;
    return CARD_THEMES[clean]?.name || clean;
  };

  const cardName = getCardDisplayName(cardType);

  const nopesInHand = hand.filter(c => c.type === 'nope');
  const nowsInHand = hand.filter(c => c.type.endsWith('_now'));

  return (
    <OverlayPortal>
      <div className="game-modal-layer fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[2px]">
      <div
        className="flex flex-col gap-0 min-w-[320px] max-w-[560px] w-[95%] max-h-[calc(100dvh-2rem)] overflow-y-auto animate-fade-in"
      >
      <div className="bg-[#fafaf5] border-3 border-slate-900 shadow-[6px_6px_0px_0px_#0f0f0f] rounded-none overflow-hidden flex flex-col">
        <div
          className={`px-4 py-2 flex items-center justify-between ${
            isCanceled
              ? 'bg-rose-600'
              : (isNowOnly ? 'bg-amber-500' : 'bg-slate-950')
          }`}
        >
          <span className="font-headline font-black text-[10px] text-white uppercase tracking-widest">
            {isCanceled
              ? t('nope_panel_canceled')
              : (isNowOnly ? 'NOW OR NEVER!' : t('nope_panel_active'))}
          </span>
          
          <div className="flex items-center gap-1.5">
            <div className="relative h-7 w-7 flex items-center justify-center flex-shrink-0">
              <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                <circle cx="14" cy="14" r="11" className="stroke-white/20 fill-transparent" strokeWidth="2.5" />
                <circle
                  cx="14" cy="14" r="11"
                  className="stroke-white fill-transparent transition-all duration-75"
                  strokeWidth="2.5"
                  strokeDasharray={69}
                  strokeDashoffset={69 - (69 * percentage) / 100}
                />
              </svg>
              <span className="text-[8px] font-headline font-black text-white">
                {(timeLeft / 1000).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex flex-col flex-1 min-w-0">
              {actingPlayerName && cardName ? (
                <>
                  <span className="text-[9px] font-headline font-black text-slate-400 uppercase tracking-wider">
                    {isNowOnly ? 'LÁ BÀI VỪA KÍCH HOẠT XONG' : t('nope_panel_playing', { name: '' })}
                  </span>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span
                      className="font-headline font-black text-xs text-slate-900 truncate max-w-[120px]"
                    >
                      {actingPlayerName}
                    </span>
                    <span className="font-headline font-black text-xs uppercase" style={{ color: isCanceled ? '#dc2626' : (isNowOnly ? '#d97706' : '#7c3aed') }}>
                      {cardName}
                    </span>
                  </div>
                  {targetPlayerName && (
                    <span className="text-[9px] font-bold text-slate-500 mt-0.5">
                      {t('nope_panel_targeting', { target: targetPlayerName })}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs font-headline font-black text-slate-900 uppercase">
                  {t('status_waiting_nope')}
                </span>
              )}
              {isCounterNope && !isNowOnly && (
                <span
                  className="text-[9px] font-headline font-black uppercase mt-1"
                  style={{ color: isCanceled ? '#dc2626' : '#059669' }}
                >
                  {'Nope x' + nopeCount + ' — Có thể nốp lại!'}
                </span>
              )}
            </div>

            <div className="flex gap-2 flex-shrink-0 items-center">
              {canRespond && (
                <ImageButton variant="secondary"
                  onClick={onPass}
                  className="font-headline font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#1a1c1c] px-3.5 py-2 rounded-none text-[10px] hover:bg-slate-350 hover:scale-105 active:scale-95 transition-all uppercase text-slate-800"
                >
                  Pass
                </ImageButton>
              )}

              {canNope && (
                <button
                  onClick={onPlayNope}
                  className="font-headline font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#1a1c1c] px-3.5 py-2 rounded-none text-[10px] hover:scale-105 active:scale-95 transition-all uppercase"
                  style={{
                    background: isCounterNope ? '#7c3aed' : '#dc2626',
                    color: '#ffffff',
                  }}
                >
                  {isCounterNope ? t('nope_panel_counter_btn') : t('nope_panel_nope_btn')}
                </button>
              )}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-slate-200 pt-3">
            <span className="text-[9px] font-headline font-black text-slate-400 uppercase tracking-wider block mb-2">
              {isNowOnly ? 'Bài NOW khả dụng:' : 'Bài phản ứng của bạn (Click để đánh ngay):'}
            </span>
            
            <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar min-h-[46px] items-center">
              {canNope && nopesInHand.map((card) => {
                const theme = CARD_THEMES.nope || {};
                return (
                  <button
                    key={card.id}
                    onClick={onPlayNope}
                    className="flex items-center gap-1.5 border-2 border-slate-900 rounded-none px-2.5 py-1 text-[9px] font-headline font-black uppercase transition-all duration-75 hover:scale-105 active:scale-95 shadow-[1.5px_1.5px_0px_0px_#1a1c1c] hover:-translate-y-0.5"
                    style={{ backgroundColor: '#fca5a5', color: '#1a1c1c' }}
                  >
                    <span>{theme.name || 'Nope!'}</span>
                  </button>
                );
              })}

              {nowsInHand.map((card) => {
                const theme = CARD_THEMES[card.type] || {};
                return (
                  <button
                    key={card.id}
                    onClick={() => onPlayNow && onPlayNow(card)}
                    className="flex items-center gap-1.5 border-2 border-slate-900 rounded-none px-2.5 py-1 text-[9px] font-headline font-black uppercase transition-all duration-75 hover:scale-105 active:scale-95 shadow-[1.5px_1.5px_0px_0px_#1a1c1c] hover:-translate-y-0.5"
                    style={{
                      backgroundColor: card.type === 'clairvoyance_now' ? '#06b6d4' : (card.type === 'alter_the_future_3_now' ? '#ec4899' : '#f59e0b'),
                      color: card.type === 'alter_the_future_3_now' ? '#ffffff' : '#1a1c1c'
                    }}
                  >
                    <span>{theme.name || card.type}</span>
                  </button>
                );
              })}

              {((isNowOnly && nowsInHand.length === 0) || (!isNowOnly && nopesInHand.length === 0 && nowsInHand.length === 0)) && (
                <span className="text-[10px] font-medium text-slate-400 italic">
                  Không có bài phản ứng khả dụng
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-1 bg-slate-100 w-full mt-auto">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${percentage}%`,
              background: isCanceled ? '#dc2626' : (isNowOnly ? '#f59e0b' : '#7c3aed'),
            }}
          />
        </div>
      </div>
      </div>
      </div>
    </OverlayPortal>
  );
}

// ==========================================
// NOPE RESULT TOAST
// ==========================================
export function NopeResultToast({ canceled, cardType, actingPlayerName }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [canceled, cardType]);

  if (!visible) return null;

  const getCardDisplayName = (type) => {
    if (!type) return '';
    const clean = type.replace('discard_', '');
    const key = `card_${clean}_name`;
    const translated = t(key);
    if (translated !== key) return translated;
    return CARD_THEMES[clean]?.name || clean;
  };

  const cardName = getCardDisplayName(cardType);

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-none border-3 border-slate-900 flex items-center gap-3 animate-fade-in"
      style={{
        background: canceled ? '#dc2626' : '#059669',
        boxShadow: '4px 4px 0px 0px #0f0f0f',
      }}
    >
      <span
        className="font-headline font-black text-sm uppercase tracking-wider text-white"
      >
        {canceled
          ? t('nope_result_canceled', { card: cardName })
          : t('nope_result_executed', { card: cardName })}
      </span>
    </div>
  );
}

// ==========================================
// NOW CARD TOAST
// ==========================================
export function NowCardToast({ playerName, cardType }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [playerName, cardType]);

  if (!visible) return null;

  const getCardDisplayName = (type) => {
    if (!type) return '';
    const clean = type.replace('discard_', '').replace('_now', '');
    const key = `card_${type.replace('discard_', '')}_name`;
    const translated = t(key);
    if (translated !== key) return translated;
    return CARD_THEMES[clean]?.name || clean;
  };

  const cardName = getCardDisplayName(cardType);

  return (
    <div
      className="fixed top-6 right-6 z-[110] max-w-[280px] bg-slate-950 border-3 border-slate-900 rounded-none overflow-hidden animate-fade-in"
      style={{ boxShadow: '4px 4px 0px 0px rgba(124,58,237,1)' }}
    >
      <div className="bg-violet-600 px-3 py-1 border-b-2 border-slate-900">
        <span className="font-headline font-black text-[9px] text-white uppercase tracking-widest">
          NGOÀI LƯỢT
        </span>
      </div>
      <div className="px-4 py-2.5 bg-[#fafaf5]">
        <p className="font-headline font-black text-xs text-slate-900 leading-snug">
          <span className="text-violet-600">{playerName}</span>
          {' '}
          <span className="font-black text-slate-950">{cardName}</span>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 5. BURY POSITION SELECT MODAL
// ==========================================
export function BuryPositionModal({ hand, deckCount, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);
  const [position, setPosition] = useState(0);

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-3xl">
      {(closeModal) => (
        <>
          <div className="text-center">
            <h3 className="text-2xl font-headline font-black text-primary uppercase">Chôn Bài (Bury Card)</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Chọn 1 lá bài từ tay của bạn và chọn vị trí chôn trong bộ bài bốc. Lượt chơi của bạn sẽ kết thúc.
            </p>
          </div>

          <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-start md:justify-center max-w-full custom-scrollbar px-4">
            {hand.map((card) => {
              const isSelected = selectedId === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedId(card.id)}
                  className="transform transition-transform cursor-pointer flex-shrink-0"
                >
                  <Card type={card.type} skinIndex={card.skinIndex ?? 0} selected={isSelected} />
                </div>
              );
            })}
          </div>

          {selectedId && (
            <div className="w-full flex flex-col gap-3 px-6 py-4 bg-white border-2 border-slate-900 rounded-none shadow-[3px_3px_0px_0px_#0f0f0f]">
              <span className="text-xs font-headline font-black text-slate-900 uppercase">
                Vị trí chôn: {position === 0 ? 'Dưới Cùng (Bottom)' : position === deckCount ? 'Trên Cùng (Top)' : `Vị trí thứ ${position} từ dưới lên`}
              </span>
              <input
                type="range"
                min="0"
                max={deckCount}
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value, 10))}
                className="w-full accent-primary cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none border border-slate-900"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                <span>Dưới Đáy (0)</span>
                <span>Giữa Bộ Bài</span>
                <span>Trên Cùng ({deckCount})</span>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-2">
            <button
              onClick={() => closeModal(() => onRespond(selectedId, position))}
              disabled={!selectedId}
              className={`btn-detonator px-8 py-3 rounded-none font-headline font-black uppercase text-sm
                ${!selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              Xác nhận Chôn Bài
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 6. GARBAGE COLLECTION / POT LUCK SELECT MODAL
// ==========================================
export function GarbageSelectModal({ hand, title, description, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-3xl">
      {(closeModal) => (
        <>
          <div className="text-center">
            <h3 className="text-2xl font-headline font-black text-primary uppercase">{title}</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">{description}</p>
          </div>

          <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-start md:justify-center max-w-full custom-scrollbar px-4">
            {hand.map((card) => {
              const isSelected = selectedId === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedId(card.id)}
                  className="transform transition-transform cursor-pointer flex-shrink-0"
                >
                  <Card type={card.type} skinIndex={card.skinIndex ?? 0} selected={isSelected} />
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-2">
            <button
              onClick={() => closeModal(() => onRespond(selectedId))}
              disabled={!selectedId}
              className={`btn-detonator px-8 py-3 rounded-none font-headline font-black uppercase text-sm
                ${!selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              Nộp Lá Bài Đã Chọn
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 7. ZOMBIE KITTEN REVIVAL TARGET MODAL
// ==========================================
export function ZombieReviveModal({ players, deckCount = 0, onRespond }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [position, setPosition] = useState(0);

  const deadPlayers = players.filter((p) => !p.alive);

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-xl">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-primary uppercase">Hồi Sinh Đồng Đội (Zombie Revival)</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Bạn đã dùng Mèo Thây Ma. Hãy chọn 1 người chơi đã bị loại để đưa họ quay trở lại trận đấu.
            </p>
          </div>

          {deadPlayers.length === 0 ? (
            <div className="py-8 text-sm font-bold text-slate-400 uppercase">
              Không có người chơi nào đã chết để hồi sinh.
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto px-2 w-full">
              {deadPlayers.map((p) => {
                const isSelected = selectedPlayerId === p.userId;
                return (
                  <div
                    key={p.userId}
                    onClick={() => setSelectedPlayerId(p.userId)}
                    className={`flex items-center justify-between p-4 border-2 rounded-none cursor-pointer transition-all duration-100
                      ${isSelected 
                        ? 'border-yellow-400 bg-yellow-400/10 shadow-[3px_3px_0px_0px_#0f0f0f] translate-y-[-2px]' 
                        : 'border-slate-900 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left flex flex-col">
                        <span className="text-xs font-headline font-black text-slate-900 uppercase">{p.userId}</span>
                        <span className="text-[10px] font-bold text-slate-400">TRẠNG THÁI: HỒN MA</span>
                      </div>
                    </div>
                    {isSelected && <CheckIcon className="w-5 h-5 text-green-600" strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 px-6 py-4 bg-white border-2 border-slate-900 rounded-none text-left w-full shadow-[3px_3px_0px_0px_#0f0f0f]">
            <span className="text-xs font-headline font-black text-slate-900 uppercase">
              Vị trí đặt Mèo Nổ vào bộ bài: {position === 0 ? 'Dưới cùng (Bottom)' : position === deckCount ? 'Trên cùng (Top)' : `Vị trí thứ ${position} từ dưới lên`}
            </span>
            <input
              type="range"
              min="0"
              max={deckCount}
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none border border-slate-900"
            />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>Dưới đáy (0)</span>
              <span>Giữa bộ bài</span>
              <span>Trên cùng ({deckCount})</span>
            </div>
          </div>

          <div className="flex justify-center mt-2">
            <button
              onClick={() => {
                const targetPlayerId = deadPlayers.length === 0 ? null : selectedPlayerId;
                closeModal(() => onRespond(targetPlayerId, position));
              }}
              disabled={deadPlayers.length > 0 && !selectedPlayerId}
              className={`btn-detonator px-8 py-3 rounded-none font-headline font-black uppercase text-sm
                ${deadPlayers.length > 0 && !selectedPlayerId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              {deadPlayers.length === 0 ? "Bỏ qua hồi sinh" : "Triệu Hồi Hồi Sinh"}
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 8. DEFUSE POSITION SELECT MODAL
// ==========================================
export function DefusePositionModal({ deckCount, onRespond, cardType }) {
  const [position, setPosition] = useState(0);

  const isImploding = cardType === 'imploding_kitten';
  const name = isImploding ? 'Mèo Sập Nguồn' : 'Mèo Nổ';

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-xl">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-primary uppercase">
              {isImploding ? 'Tránh Bom Thành Công!' : 'Gỡ Mìn Thành Công!'}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              {isImploding 
                ? 'Bạn vừa bốc phải Mèo Sập Nguồn (mặt úp). Hãy chọn vị trí đặt lại lá bài này (lật ngửa) vào bộ bài bốc.' 
                : `Bạn đã dùng lá bài Gỡ Mìn. Hãy chọn vị trí đặt quân **${name}** ngược lại vào bộ bài bốc.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 px-6 py-4 bg-white border-2 border-slate-900 rounded-none text-left w-full shadow-[3px_3px_0px_0px_#0f0f0f]">
            <span className="text-xs font-headline font-black text-slate-900 uppercase">
              Vị trí đặt bom: {position === 0 ? 'Dưới cùng (Bottom)' : position === deckCount ? 'Trên cùng (Top)' : `Vị trí thứ ${position} từ dưới lên`}
            </span>
            <input
              type="range"
              min="0"
              max={deckCount}
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none border border-slate-900"
            />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>Dưới đáy (0)</span>
              <span>Giữa bộ bài</span>
              <span>Trên cùng ({deckCount})</span>
            </div>
          </div>

          <div className="flex justify-center mt-2">
            <ImageButton variant="danger"
              onClick={() => closeModal(() => onRespond(position))}
              className=" px-8 py-3 rounded-none font-headline font-black uppercase text-sm "
            >
              {isImploding ? 'Đặt Lại Mèo Sập Nguồn' : 'Đặt Lại Quân Bài'}
            </ImageButton>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 9. SELECT TARGET MODAL (after playing card)
// ==========================================
export function SelectTargetModal({ players, myUserId, cardType, onRespond }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const isFeedTheDead = cardType === 'feed_the_dead';
  const targetOpponents = players.filter((p) => {
    if (p.userId === myUserId) return false;
    return isFeedTheDead ? !p.alive : p.alive;
  });

  const CARD_DISPLAY_NAMES = {
    favor: 'Xin Bài (Favor)',
    mark: 'Đánh Dấu (Mark)',
    ill_take_that: "Tôi Lấy Đó (I'll Take That)",
    target_attack_2x: 'Tấn Công Mục Tiêu (Target Attack)',
    combo_2: 'Combo 2 Mèo',
    combo_3: 'Combo 3 Mèo',
    feed_the_dead: 'Nuôi Xác Sống (Feed the Dead)',
  };

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-xl">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-primary uppercase">
              Chọn Mục Tiêu
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Bạn đã đánh lá <strong className="text-slate-950 uppercase">{CARD_DISPLAY_NAMES[cardType] || cardType}</strong>. Hãy chọn người chơi bị tác động.
            </p>
          </div>

          {targetOpponents.length === 0 ? (
            <div className="py-8 text-sm font-bold text-slate-400 uppercase">
              Không có người chơi nào khả dụng.
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto px-2 w-full">
              {targetOpponents.map((p) => {
                const isSelected = selectedPlayerId === p.userId;
                return (
                  <div
                    key={p.userId}
                    onClick={() => setSelectedPlayerId(p.userId)}
                    className={`flex items-center justify-between p-4 border-2 rounded-none cursor-pointer transition-all duration-100
                      ${isSelected
                        ? 'border-yellow-400 bg-yellow-400/10 shadow-[3px_3px_0px_0px_#0f0f0f] translate-y-[-2px]'
                        : 'border-slate-900 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-none bg-indigo-50 border-2 border-slate-900 flex items-center justify-center text-sm font-headline font-black uppercase text-slate-900 shadow-[2px_2px_0px_0px_#0f0f0f]">
                        {(p.username || p.userId).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left flex flex-col">
                        <span className="text-xs font-headline font-black text-slate-900 uppercase">{p.username || p.userId}</span>
                        <span className="text-[10px] font-bold text-slate-400">🃏 {p.handCount} lá bài</span>
                      </div>
                    </div>
                    {isSelected && <CheckIcon className="w-5 h-5 text-green-600" strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center mt-2">
            <button
              onClick={() => closeModal(() => onRespond(selectedPlayerId))}
              disabled={!selectedPlayerId}
              className={`btn-detonator px-8 py-3 rounded-none font-headline font-black uppercase text-sm
                ${!selectedPlayerId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              Xác Nhận Mục Tiêu
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 10. FEED THE DEAD MODAL
// ==========================================
export function FeedTheDeadModal({ targetPlayerName, hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-3xl">
      {(closeModal) => (
        <>
          <div className="text-center w-full relative pb-4 border-b-4 border-dashed border-slate-900">
            <div className="flex justify-center mb-3">
              <svg viewBox="0 0 64 64" className="w-16 h-16 drop-shadow-[2px_2px_0px_#1a1a1a]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 56V22C12 13 20 6 32 6C44 6 52 13 52 22V56H12Z" fill="#15803d" stroke="#1a1a1a" strokeWidth="3" />
                <path d="M22 56C22 56 26 40 28 32M28 32C29 28 31 20 34 14" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
                <path d="M28 32C26 28 24 24 22 20" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M30 40C33 36 36 32 38 28" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M6 56H58" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round" />
              </svg>
            </div>
            <h3 className="text-3xl font-headline font-black text-emerald-600 uppercase tracking-tight">Nuôi Thây Ma (Feed the Dead)</h3>
            <p className="text-xs font-bold text-slate-600 mt-2 px-6">
              Linh hồn thây ma <strong className="text-emerald-800 uppercase underline decoration-2">{targetPlayerName}</strong> đang đói khát! Hãy chọn một lá bài tế phẩm chất lượng từ tay của bạn để dâng hiến cho họ.
            </p>
          </div>

          <div className="w-full flex-1 overflow-x-auto flex gap-5 pb-5 pt-6 justify-start md:justify-center max-w-full custom-scrollbar px-4">
            {hand.map((card) => {
              const isSelected = selectedId === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedId(card.id)}
                  className={`relative transform transition-all cursor-pointer flex-shrink-0 duration-100 hover:scale-105 active:scale-95 rounded-none p-1
                    ${isSelected ? 'bg-emerald-100 ring-4 ring-emerald-500 -translate-y-2' : 'hover:-translate-y-1'}`}
                >
                  <Card type={card.type} skinIndex={card.skinIndex ?? 0} selected={isSelected} />
                  {isSelected && (
                    <div className="absolute -top-3.5 -right-3.5 bg-emerald-500 text-white border-3 border-slate-900 rounded-none w-8 h-8 flex items-center justify-center font-headline font-black text-base shadow-[2px_2px_0px_#1a1a1a] z-10 animate-bounce">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center w-full mt-2">
            <button
              onClick={() => closeModal(() => onRespond(selectedId))}
              disabled={!selectedId}
              className={`px-10 py-4 rounded-none font-headline font-black uppercase tracking-wider text-base border-4 border-slate-900 transition-all duration-100 hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_#1a1a1a]
                ${selectedId 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer' 
                  : 'bg-slate-300 text-slate-500 border-slate-400 shadow-none cursor-not-allowed pointer-events-none'}`}
            >
              Cúng Tế Lá Bài
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 11. GRAVE ROBBER MODAL
// ==========================================
export function GraveRobberModal({ hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-3xl">
      {(closeModal) => (
        <>
          <div className="text-center">
            <h3 className="text-2xl font-headline font-black text-primary uppercase">Kẻ Trộm Mộ (Grave Robber)</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Bạn là linh hồn/thây ma. Hãy chọn 1 lá bài từ tay của bạn để trộm/đưa vào mộ (bộ bài bỏ). Lớp bảo vệ của mộ sẽ được tái tạo.
            </p>
          </div>

          {hand.length === 0 ? (
            <div className="text-center py-8 text-sm font-headline font-black text-slate-400 uppercase">
              Bạn không có lá bài nào để trộm mộ!
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-start md:justify-center max-w-full custom-scrollbar px-4">
              {hand.map((card) => {
                const isSelected = selectedId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedId(card.id)}
                    className="transform transition-transform cursor-pointer flex-shrink-0 hover:scale-105 active:scale-95 duration-100"
                  >
                    <Card type={card.type} skinIndex={card.skinIndex ?? 0} selected={isSelected} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center mt-2">
            <button
              onClick={() => closeModal(() => onRespond(selectedId))}
              disabled={hand.length > 0 && !selectedId}
              className={`btn-detonator px-8 py-3 rounded-none font-headline font-black uppercase text-sm
                ${hand.length > 0 && !selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              Xác Nhận Đưa Vào Mộ
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 12. DIG DEEPER MODAL
// ==========================================
export function DigDeeperModal({ firstCard, onRespond }) {
  if (!firstCard) return null;

  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-md">
      {(closeModal) => (
        <>
          <div className="w-full pb-4 border-b-4 border-dashed border-slate-900">
            <div className="flex justify-center mb-3">
              <svg viewBox="0 0 64 64" className="w-16 h-16 drop-shadow-[2px_2px_0px_#1a1a1a]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M48 16L32 32" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
                <path d="M44 12L52 20" stroke="#b45309" stroke-width="5" stroke-linecap="round" />
                <path d="M28 28L12 44C12 44 14 50 20 50L36 34" fill="#9ca3af" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" />
                <path d="M12 44L20 52" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round" />
              </svg>
            </div>
            <h3 className="text-3xl font-headline font-black text-amber-700 uppercase tracking-tight">Đào Sâu (Dig Deeper)</h3>
            <p className="text-xs font-bold text-slate-600 mt-2 px-4">
              Lưỡi xẻng vừa chạm thấy một lá bài cổ xưa bí ẩn dưới lòng đất! Hãy quyết định vận mệnh của nó.
            </p>
          </div>

          <div className="py-6 px-8 bg-[#fdf8f5] border-4 border-dashed border-amber-800/40 w-full flex justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none select-none">
              <div className="w-full h-full bg-[radial-gradient(#78350f_2px,transparent_2px)] [background-size:12px_12px]" />
            </div>
            
            <div className="relative z-10 animate-zombie-hand-rise">
              <Card type={firstCard.type} skinIndex={firstCard.skinIndex ?? 0} disabled={true} />
            </div>
          </div>

          <div className="flex gap-4 w-full justify-center mt-2">
            <button
              onClick={() => closeModal(() => onRespond('keep'))}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-headline font-black border-4 border-slate-900 shadow-[4px_4px_0px_0px_#1a1a1a] py-3.5 rounded-none uppercase transition-all duration-100 hover:scale-105 active:scale-95 text-xs tracking-wider"
            >
              Giữ Lá Bài Này
            </button>
            <button
              onClick={() => closeModal(() => onRespond('pass'))}
              className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-headline font-black border-4 border-slate-900 shadow-[4px_4px_0px_0px_#1a1a1a] py-3.5 rounded-none uppercase transition-all duration-100 hover:scale-105 active:scale-95 text-xs tracking-wider"
            >
              Chôn / Trả Lại
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 13. ARMAGEDDON DISTRIBUTE MODAL
// ==========================================
export function ArmageddonDistributeModal({ targetPlayerName, onRespond }) {
  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-xl">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-primary uppercase">Phân Phát Armageddon</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Bạn đã kích hoạt Armageddon nhắm vào <strong className="text-slate-950 uppercase">{targetPlayerName}</strong>. Hãy chọn lá bài bạn muốn giữ lại cho MÌNH (lá bài còn lại sẽ được đưa cho đối thủ một cách bí mật).
            </p>
          </div>

          <div className="flex gap-6 justify-center items-center py-4 flex-wrap">
            <button
              onClick={() => closeModal(() => onRespond('godcat'))}
              className="flex flex-col items-center gap-3 p-4 bg-white border-2 border-slate-900 rounded-none hover:scale-105 transition-all duration-100 shadow-[3px_3px_0px_0px_#0f0f0f]"
            >
              <Card type="godcat" disabled={true} />
              <span className="text-xs font-headline font-black uppercase text-green-600">Giữ Godcat</span>
            </button>
            
            <button
              onClick={() => closeModal(() => onRespond('devilcat'))}
              className="flex flex-col items-center gap-3 p-4 bg-white border-2 border-slate-900 rounded-none hover:scale-105 transition-all duration-100 shadow-[3px_3px_0px_0px_#0f0f0f]"
            >
              <Card type="devilcat" disabled={true} />
              <span className="text-xs font-headline font-black uppercase text-red-600">Giữ Devilcat</span>
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 14. ARMAGEDDON DECISION MODAL
// ==========================================
export function ArmageddonDecisionModal({ activatorPlayerName, onRespond }) {
  return (
    <BrutalModal isOpen={true} onClose={() => {}} maxWidth="max-w-md">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-red-500 uppercase">Quyết Định Armageddon</h3>
            <p className="text-xs font-bold text-slate-500 mt-1 text-center">
              <strong className="text-slate-950 uppercase">{activatorPlayerName}</strong> đã đặt một lá bài úp trước mặt bạn và một lá trước mặt họ.
              <br />
              Hãy chọn giữ nguyên lá bài của bạn hoặc tráo đổi với đối thủ!
            </p>
          </div>

          <div className="flex gap-4 w-full justify-center">
            <button
              onClick={() => closeModal(() => onRespond('keep'))}
              className="flex-1 bg-green-550 hover:bg-green-600 text-white font-headline font-black border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0f0f0f] py-3 rounded-none uppercase transition-all duration-100 hover:scale-105 active:scale-95"
            >
              Giữ Nguyên
            </button>
            <button
              onClick={() => closeModal(() => onRespond('swap'))}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-headline font-black border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0f0f0f] py-3 rounded-none uppercase transition-all duration-100 hover:scale-105 active:scale-95"
            >
              Tráo Đổi
            </button>
          </div>
        </>
      )}
    </BrutalModal>
  );
}

// ==========================================
// 15. CLAIRVOYANCE REVEAL MODAL
// ==========================================
export function ClairvoyanceRevealModal({ position, onClose }) {
  return (
    <BrutalModal isOpen={true} onClose={onClose} maxWidth="max-w-sm">
      {(closeModal) => (
        <>
          <div>
            <h3 className="text-2xl font-headline font-black text-primary uppercase">Thấu Thị (Clairvoyance)</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Lá bài Exploding Kitten vừa được người chơi chèn vào bộ bài tại vị trí:
            </p>
          </div>

          <div className="bg-yellow-400 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f0f0f] p-6 rounded-none w-full">
            <span className="text-2xl font-headline font-black text-slate-950 block">
              {position === 0 ? 'Dưới Cùng (Bottom)' : `Thứ ${position} từ dưới lên`}
            </span>
          </div>

          <ImageButton variant="danger"
            onClick={() => closeModal()}
            className=" px-8 py-3 rounded-none font-headline font-black uppercase text-sm w-full mt-2 "
          >
            Tôi đã hiểu
          </ImageButton>
        </>
      )}
    </BrutalModal>
  );
}
