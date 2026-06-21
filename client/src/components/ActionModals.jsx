import React, { useState, useEffect } from 'react';
import Card from './Card.jsx';
import { CheckIcon } from './Icons.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { CARD_THEMES } from './Card.jsx';

// ==========================================
// 1. SEE THE FUTURE MODAL
// ==========================================
export function SeeFutureModal({ cards, onClose }) {
  if (!cards) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary flex items-center justify-center gap-2 uppercase">
            Tiên Tri (See the Future)
          </h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Đây là {cards.length} lá bài trên cùng bộ bài bốc (từ trái qua phải - từ trên xuống dưới).
          </p>
        </div>

        <div className="flex gap-6 justify-center items-center py-4 flex-wrap">
          {cards.map((card, index) => (
            <div key={card.id || index} className="relative group">
              <Card type={card.type} skinIndex={card.skinIndex ?? 0} disabled={true} />
              <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-950 font-headline font-black text-[9px] px-2.5 py-0.5 rounded-full border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase">
                Thứ {index + 1}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm"
        >
          Xong, tôi đã nhớ
        </button>
      </div>
    </div>
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

  const handleConfirm = () => {
    onConfirm(order.map((c) => c.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary flex items-center justify-center gap-2 uppercase">
            Định Đoạt (Alter the Future)
          </h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Thay đổi thứ tự 3 lá bài trên cùng bộ bài bốc. Sắp xếp từ trái qua phải (lá đầu tiên nằm bên trái).
          </p>
        </div>

        <div className="flex gap-4 sm:gap-6 justify-center items-stretch py-4 flex-wrap">
          {order.map((card, index) => (
            <div key={card.id || index} className="flex flex-col items-center gap-3 bg-surface border-3 border-on-surface p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
              <span className="text-[10px] font-headline font-black text-primary uppercase">
                {index === 0 ? 'Trên Cùng (Top)' : `Vị trí ${index + 1}`}
              </span>
              
              <Card type={card.type} skinIndex={card.skinIndex ?? 0} disabled={true} />
              
              <div className="flex gap-2">
                <button
                  onClick={() => moveLeft(index)}
                  disabled={index === 0}
                  className="px-3 py-1 bg-surface border-2 border-on-surface hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-surface text-xs rounded-lg font-bold text-on-surface transition-all shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
                >
                  ◀
                </button>
                <button
                  onClick={() => moveRight(index)}
                  disabled={index === order.length - 1}
                  className="px-3 py-1 bg-surface border-2 border-on-surface hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-surface text-xs rounded-lg font-bold text-on-surface transition-all shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
                >
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          className="btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm"
        >
          Lưu & Sắp Xếp Lại
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 3. FAVOR REQUEST MODAL
// ==========================================
export function FavorRequestModal({ fromPlayerId, fromPlayerName, hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleSend = () => {
    if (!selectedId) return;
    onRespond(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Bị Xin Bài! (Favor Request)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Người chơi <strong className="text-on-surface uppercase">{fromPlayerName || fromPlayerId}</strong> đã đánh lá Favor nhắm vào bạn. Hãy chọn 1 lá để trao cho họ.
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
            onClick={handleSend}
            disabled={!selectedId}
            className={`btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm
              ${!selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Gửi Lá Bài Đã Chọn
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. NOPE COUNTDOWN DISPLAY
// ==========================================
export function NopeCountdown({ eventId, timeoutMs, hasNopeCard, onPlayNope, onPass, actingPlayerName, cardType, targetPlayerName, nopeCount }) {
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

  // Get card display name
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
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9000] flex flex-col gap-0 min-w-[300px] max-w-[420px]"
      style={{ filter: 'drop-shadow(6px 6px 0px rgba(26,28,28,1))' }}
    >
      {/* Main panel */}
      <div
        className="bg-white border-4 border-on-surface rounded-2xl overflow-hidden"
      >
        {/* Header strip */}
        <div
          className={`px-4 py-2 flex items-center justify-between ${
            isCanceled
              ? 'bg-rose-600'
              : 'bg-on-surface'
          }`}
        >
          <span className="font-headline font-black text-[10px] text-white uppercase tracking-widest">
            {isCanceled
              ? t('nope_panel_canceled')
              : t('nope_panel_active')}
          </span>
          {/* Countdown */}
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

        {/* Body */}
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Info block */}
          <div className="flex flex-col flex-1 min-w-0">
            {actingPlayerName && cardName ? (
              <>
                <span className="text-[9px] font-headline font-black text-on-surface-variant uppercase tracking-wider">
                  {t('nope_panel_playing', { name: '' })}
                </span>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    className="font-headline font-black text-xs text-on-surface uppercase truncate max-w-[100px]"
                    style={{ color: '#0f172a' }}
                  >
                    {actingPlayerName}
                  </span>
                  <span className="font-headline font-black text-xs uppercase" style={{ color: isCanceled ? '#dc2626' : '#7c3aed' }}>
                    {cardName}
                  </span>
                </div>
                {targetPlayerName && (
                  <span className="text-[9px] font-bold text-on-surface-variant mt-0.5">
                    {t('nope_panel_targeting', { target: targetPlayerName })}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-headline font-black text-on-surface uppercase">
                {t('status_waiting_nope')}
              </span>
            )}
            {isCounterNope && (
              <span
                className="text-[9px] font-headline font-black uppercase mt-1"
                style={{ color: isCanceled ? '#dc2626' : '#059669' }}
              >
                {isCanceled ? 'Nope x' + nopeCount : 'Nope x' + nopeCount + ' — Co the nope lai!'}
              </span>
            )}
          </div>

          {/* Action buttons group */}
          <div className="flex gap-2 flex-shrink-0">
            {/* Pass button */}
            <button
              onClick={onPass}
              className="font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3.5 py-2 rounded-xl text-[10px] bg-slate-200 hover:bg-slate-300 hover:scale-105 active:scale-95 transition-all uppercase text-slate-850"
            >
              Pass
            </button>

            {/* Nope button */}
            {hasNopeCard && (
              <button
                onClick={onPlayNope}
                className="font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3.5 py-2 rounded-xl text-[10px] hover:scale-105 active:scale-95 transition-all uppercase"
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

        {/* Progress bar at bottom */}
        <div className="h-1 bg-slate-100 w-full">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${percentage}%`,
              background: isCanceled ? '#dc2626' : '#7c3aed',
            }}
          />
        </div>
      </div>
    </div>
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
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[9001] px-6 py-3 rounded-2xl border-4 border-on-surface flex items-center gap-3"
      style={{
        background: canceled ? '#dc2626' : '#059669',
        boxShadow: '4px 4px 0px 0px #1a1c1c',
        animation: 'nopeSplashIn 0.25s ease-out',
      }}
    >
      <span
        className="font-headline font-black text-sm uppercase tracking-wider"
        style={{ color: '#ffffff' }}
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
      className="fixed top-6 right-6 z-[9001] max-w-[280px] bg-on-surface border-4 border-on-surface rounded-2xl overflow-hidden"
      style={{ boxShadow: '4px 4px 0px 0px rgba(124,58,237,1)' }}
    >
      {/* Top label strip */}
      <div className="bg-violet-600 px-3 py-1">
        <span className="font-headline font-black text-[9px] text-white uppercase tracking-widest">
          NGOAI LUOT
        </span>
      </div>
      <div className="px-4 py-2.5 bg-on-surface">
        <p className="font-headline font-black text-xs text-white leading-snug">
          <span style={{ color: '#fbbf24' }}>{playerName}</span>
          {' '}
          <span style={{ color: '#a78bfa' }} className="font-black">{cardName}</span>
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

  const handleConfirm = () => {
    if (!selectedId) return;
    onRespond(selectedId, position);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Chôn Bài (Bury Card)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Chọn 1 lá bài từ tay của bạn và chọn vị trí chôn trong bộ bài bốc. Lượt chơi của bạn sẽ kết thúc.
          </p>
        </div>

        {/* Card selection */}
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

        {/* Position selection slider */}
        {selectedId && (
          <div className="flex flex-col gap-3 px-6 py-4 bg-surface border-3 border-on-surface rounded-2xl">
            <span className="text-xs font-headline font-black text-on-surface uppercase">
              Vị trí chôn: {position === 0 ? 'Dưới Cùng (Bottom)' : position === deckCount ? 'Trên Cùng (Top)' : `Vị trí thứ ${position} từ dưới lên`}
            </span>
            <input
              type="range"
              min="0"
              max={deckCount}
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] font-bold text-on-surface-variant uppercase">
              <span>Dưới Đáy (0)</span>
              <span>Giữa Bộ Bài</span>
              <span>Trên Cùng ({deckCount})</span>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-2">
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className={`btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm
              ${!selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Xác nhận Chôn Bài
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. GARBAGE COLLECTION / POT LUCK SELECT MODAL
// ==========================================
export function GarbageSelectModal({ hand, title, description, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleConfirm = () => {
    if (!selectedId) return;
    onRespond(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-headline font-black text-primary uppercase">{title}</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">{description}</p>
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
            onClick={handleConfirm}
            disabled={!selectedId}
            className={`btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm
              ${!selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Nộp Lá Bài Đã Chọn
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. ZOMBIE KITTEN REVIVAL TARGET MODAL
// ==========================================
export function ZombieReviveModal({ players, deckCount = 0, onRespond }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [position, setPosition] = useState(0);

  const deadPlayers = players.filter((p) => !p.alive);

  const handleConfirm = () => {
    if (deadPlayers.length === 0) {
      onRespond(null, position);
      return;
    }
    if (!selectedPlayerId) return;
    onRespond(selectedPlayerId, position);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Hồi Sinh Đồng Đội (Zombie Revival)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Bạn đã dùng Mèo Thây Ma. Hãy chọn 1 người chơi đã bị loại để đưa họ quay trở lại trận đấu.
          </p>
        </div>

        {deadPlayers.length === 0 ? (
          <div className="py-8 text-sm font-bold text-on-surface-variant uppercase">
            Không có người chơi nào đã chết để hồi sinh.
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto px-2">
            {deadPlayers.map((p) => {
              const isSelected = selectedPlayerId === p.userId;
              return (
                <div
                  key={p.userId}
                  onClick={() => setSelectedPlayerId(p.userId)}
                  className={`flex items-center justify-between p-4 border-3 rounded-2xl cursor-pointer transition-all duration-100
                    ${isSelected 
                      ? 'border-yellow-400 bg-yellow-400/10 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] translate-y-[-2px]' 
                      : 'border-on-surface bg-surface hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left flex flex-col">
                      <span className="text-xs font-headline font-black text-on-surface uppercase">{p.userId}</span>
                      <span className="text-[10px] font-bold text-slate-400">TRẠNG THÁI: HỒN MA</span>
                    </div>
                  </div>
                  {isSelected && <CheckIcon className="w-5 h-5 text-green-600" strokeWidth={3} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Position selection slider */}
        <div className="flex flex-col gap-3 px-6 py-4 bg-surface border-3 border-on-surface rounded-2xl text-left">
          <span className="text-xs font-headline font-black text-on-surface uppercase">
            Vị trí đặt Mèo Nổ vào bộ bài: {position === 0 ? 'Dưới cùng (Bottom)' : position === deckCount ? 'Trên cùng (Top)' : `Vị trí thứ ${position} từ dưới lên`}
          </span>
          <input
            type="range"
            min="0"
            max={deckCount}
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value, 10))}
            className="w-full accent-primary cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[9px] font-bold text-on-surface-variant uppercase">
            <span>Dưới đáy (0)</span>
            <span>Giữa bộ bài</span>
            <span>Trên cùng ({deckCount})</span>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <button
            onClick={handleConfirm}
            disabled={deadPlayers.length > 0 && !selectedPlayerId}
            className={`btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm
              ${deadPlayers.length > 0 && !selectedPlayerId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            {deadPlayers.length === 0 ? "Bỏ qua hồi sinh" : "Triệu Hồi Hồi Sinh"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. DEFUSE POSITION SELECT MODAL
// ==========================================
export function DefusePositionModal({ deckCount, onRespond, cardType }) {
  const [position, setPosition] = useState(0);

  const handleConfirm = () => {
    onRespond(position);
  };

  const isImploding = cardType === 'imploding_kitten';
  const name = isImploding ? 'Mèo Sập Nguồn' : 'Mèo Nổ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary uppercase">
            {isImploding ? 'Tránh Bom Thành Công!' : 'Gỡ Mìn Thành Công!'}
          </h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            {isImploding 
              ? 'Bạn vừa bốc phải Mèo Sập Nguồn (mặt úp). Hãy chọn vị trí đặt lại lá bài này (lật ngửa) vào bộ bài bốc.' 
              : `Bạn đã dùng lá bài Gỡ Mìn. Hãy chọn vị trí đặt quân **${name}** ngược lại vào bộ bài bốc.`}
          </p>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 bg-surface border-3 border-on-surface rounded-2xl text-left">
          <span className="text-xs font-headline font-black text-on-surface uppercase">
            Vị trí đặt bom: {position === 0 ? 'Dưới cùng (Bottom)' : position === deckCount ? 'Trên cùng (Top)' : `Vị trí thứ ${position} từ dưới lên`}
          </span>
          <input
            type="range"
            min="0"
            max={deckCount}
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value, 10))}
            className="w-full accent-primary cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[9px] font-bold text-on-surface-variant uppercase">
            <span>Dưới đáy (0)</span>
            <span>Giữa bộ bài</span>
            <span>Trên cùng ({deckCount})</span>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <button
            onClick={handleConfirm}
            className="btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm"
          >
            {isImploding ? 'Đặt Lại Mèo Sập Nguồn' : 'Đặt Lại Quân Bài'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. SELECT TARGET MODAL (after playing card)
// ==========================================
export function SelectTargetModal({ players, myUserId, cardType, onRespond }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const aliveOpponents = players.filter((p) => p.alive && p.userId !== myUserId);

  const CARD_DISPLAY_NAMES = {
    favor: 'Xin Bài (Favor)',
    mark: 'Đánh Dấu (Mark)',
    ill_take_that: "Tôi Lấy Đó (I'll Take That)",
    target_attack_2x: 'Tấn Công Mục Tiêu (Target Attack)',
    combo_2: 'Combo 2 Mèo',
    combo_3: 'Combo 3 Mèo',
  };

  const handleConfirm = () => {
    if (!selectedPlayerId) return;
    onRespond(selectedPlayerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary uppercase">
            Chọn Mục Tiêu
          </h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Bạn đã đánh lá <strong className="text-on-surface uppercase">{CARD_DISPLAY_NAMES[cardType] || cardType}</strong>. Hãy chọn người chơi bị tác động.
          </p>
        </div>

        {aliveOpponents.length === 0 ? (
          <div className="py-8 text-sm font-bold text-on-surface-variant uppercase">
            Không có người chơi nào khả dụng.
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto px-2">
            {aliveOpponents.map((p) => {
              const isSelected = selectedPlayerId === p.userId;
              return (
                <div
                  key={p.userId}
                  onClick={() => setSelectedPlayerId(p.userId)}
                  className={`flex items-center justify-between p-4 border-3 rounded-2xl cursor-pointer transition-all duration-100
                    ${isSelected
                      ? 'border-yellow-400 bg-yellow-400/10 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] translate-y-[-2px]'
                      : 'border-on-surface bg-surface hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-fixed border-2 border-on-surface flex items-center justify-center text-sm font-headline font-black uppercase text-on-surface">
                      {(p.username || p.userId).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-xs font-headline font-black text-on-surface uppercase">{p.username || p.userId}</span>
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
            onClick={handleConfirm}
            disabled={!selectedPlayerId}
            className={`btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm
              ${!selectedPlayerId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Xác Nhận Mục Tiêu
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. FEED THE DEAD MODAL
// ==========================================
export function FeedTheDeadModal({ targetPlayerName, hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleConfirm = () => {
    if (!selectedId) return;
    onRespond(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-3xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Nuôi Thây Ma (Feed the Dead)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Một người chơi thây ma <strong className="text-on-surface uppercase">{targetPlayerName}</strong> cần thức ăn. Hãy chọn 1 lá bài để trao cho họ.
          </p>
        </div>

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

        <div className="flex justify-center mt-2">
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className={`btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm
              ${!selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Gửi Lá Bài Cho Thây Ma
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11. GRAVE ROBBER MODAL
// ==========================================
export function GraveRobberModal({ hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleConfirm = () => {
    if (!selectedId) return;
    onRespond(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-3xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Kẻ Trộm Mộ (Grave Robber)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Bạn là linh hồn/thây ma. Hãy chọn 1 lá bài từ tay của bạn để trộm/đưa vào mộ (bộ bài bỏ). Lớp bảo vệ của mộ sẽ được tái tạo.
          </p>
        </div>

        {hand.length === 0 ? (
          <div className="text-center py-8 text-sm font-headline font-black text-on-surface-variant uppercase">
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
            onClick={handleConfirm}
            disabled={hand.length > 0 && !selectedId}
            className={`btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm
              ${hand.length > 0 && !selectedId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Xác Nhận Đưa Vào Mộ
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 12. DIG DEEPER MODAL
// ==========================================
export function DigDeeperModal({ firstCard, onRespond }) {
  if (!firstCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-md bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Đào Sâu (Dig Deeper)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Bạn đã đào được lá bài dưới đây. Hãy chọn giữ lại lá bài này vào tay, hoặc đặt lại lên đỉnh bộ bài.
          </p>
        </div>

        <div className="py-4">
          <Card type={firstCard.type} skinIndex={firstCard.skinIndex ?? 0} disabled={true} />
        </div>

        <div className="flex gap-4 w-full justify-center">
          <button
            onClick={() => onRespond('keep')}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-headline font-black border-4 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] py-3 rounded-2xl uppercase transition-all duration-100 hover:scale-105 active:scale-95"
          >
            Lấy lá này
          </button>
          <button
            onClick={() => onRespond('pass')}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-headline font-black border-4 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] py-3 rounded-2xl uppercase transition-all duration-100 hover:scale-105 active:scale-95"
          >
            Bỏ qua / Trả lại
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 13. ARMAGEDDON DISTRIBUTE MODAL
// ==========================================
export function ArmageddonDistributeModal({ targetPlayerName, onRespond }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Phân Phát Armageddon</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Bạn đã kích hoạt Armageddon nhắm vào <strong className="text-on-surface uppercase">{targetPlayerName}</strong>. Hãy chọn lá bài bạn muốn giữ lại cho MÌNH (lá bài còn lại sẽ được đưa cho đối thủ một cách bí mật).
          </p>
        </div>

        <div className="flex gap-6 justify-center items-center py-4 flex-wrap">
          <button
            onClick={() => onRespond('godcat')}
            className="flex flex-col items-center gap-3 p-4 bg-surface border-3 border-on-surface rounded-2xl hover:scale-105 transition-all duration-100 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]"
          >
            <Card type="godcat" disabled={true} />
            <span className="text-xs font-headline font-black uppercase text-green-600">Giữ Godcat</span>
          </button>
          
          <button
            onClick={() => onRespond('devilcat')}
            className="flex flex-col items-center gap-3 p-4 bg-surface border-3 border-on-surface rounded-2xl hover:scale-105 transition-all duration-100 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]"
          >
            <Card type="devilcat" disabled={true} />
            <span className="text-xs font-headline font-black uppercase text-red-600">Giữ Devilcat</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 14. ARMAGEDDON DECISION MODAL
// ==========================================
export function ArmageddonDecisionModal({ activatorPlayerName, onRespond }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-md bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-red-500 uppercase">Quyết Định Armageddon</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            <strong className="text-on-surface uppercase">{activatorPlayerName}</strong> đã đặt một lá bài úp trước mặt bạn và một lá trước mặt họ (Một là Godcat cứu rỗi, một là Devilcat nổ tung).
            <br />
            Hãy chọn giữ nguyên lá bài của bạn hoặc tráo đổi với đối thủ!
          </p>
        </div>

        <div className="flex gap-4 w-full justify-center">
          <button
            onClick={() => onRespond('keep')}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-headline font-black border-4 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] py-3 rounded-2xl uppercase transition-all duration-100 hover:scale-105 active:scale-95"
          >
            Giữ Nguyên
          </button>
          <button
            onClick={() => onRespond('swap')}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-headline font-black border-4 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] py-3 rounded-2xl uppercase transition-all duration-100 hover:scale-105 active:scale-95"
          >
            Tráo Đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 15. CLAIRVOYANCE REVEAL MODAL
// ==========================================
export function ClairvoyanceRevealModal({ position, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-sm bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-2xl font-headline font-black text-primary uppercase">Thấu Thị (Clairvoyance)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Lá bài Exploding Kitten vừa được người chơi chèn vào bộ bài tại vị trí:
          </p>
        </div>

        <div className="bg-yellow-400 border-4 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] p-6 rounded-2xl w-full">
          <span className="text-2xl font-headline font-black text-on-surface block">
            {position === 0 ? 'Dưới Cùng (Bottom)' : `Thứ ${position} từ dưới lên`}
          </span>
        </div>

        <button
          onClick={onClose}
          className="btn-detonator px-8 py-3 rounded-2xl font-headline font-black uppercase text-sm w-full mt-2"
        >
          Tôi đã hiểu
        </button>
      </div>
    </div>
  );
}
