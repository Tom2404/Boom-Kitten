import React, { useState, useEffect } from 'react';
import Card from './Card.jsx';

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
            👁️ Tiên Tri (See the Future)
          </h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Đây là {cards.length} lá bài trên cùng bộ bài bốc (từ trái qua phải - từ trên xuống dưới).
          </p>
        </div>

        <div className="flex gap-6 justify-center items-center py-4 flex-wrap">
          {cards.map((card, index) => (
            <div key={card.id || index} className="relative group">
              <Card type={card.type} disabled={true} />
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
          Xong, tôi đã nhớ 🧠
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
            🌀 Định Đoạt (Alter the Future)
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
              
              <Card type={card.type} disabled={true} />
              
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
          Lưu & Sắp Xếp Lại 🌀
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 3. FAVOR REQUEST MODAL
// ==========================================
export function FavorRequestModal({ fromPlayerId, hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleSend = () => {
    if (!selectedId) return;
    onRespond(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="text-2xl font-headline font-black text-primary uppercase">🤲 Bị Xin Bài! (Favor Request)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Người chơi <strong className="text-on-surface uppercase">{fromPlayerId}</strong> đã đánh lá Favor nhắm vào bạn. Hãy chọn **1 lá** để trao cho họ.
          </p>
        </div>

        <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-center max-w-full hide-scroll">
          {hand.map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedId(card.id)}
                className="transform transition-transform cursor-pointer flex-shrink-0"
              >
                <Card type={card.type} selected={isSelected} />
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
            Gửi Lá Bài Đã Chọn ✉️
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. NOPE COUNTDOWN DISPLAY
// ==========================================
export function NopeCountdown({ eventId, timeoutMs, hasNopeCard, onPlayNope }) {
  const [timeLeft, setTimeLeft] = useState(timeoutMs);

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

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 bg-white border-4 border-on-surface rounded-3xl px-6 py-4 shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] flex items-center gap-4 animate-bounce">
      {/* Circle countdown visual */}
      <div className="relative h-10 w-10 flex items-center justify-center flex-shrink-0">
        <svg className="absolute inset-0 h-full w-full transform -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="17"
            className="stroke-slate-200 fill-transparent"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            className="stroke-primary fill-transparent transition-all duration-75"
            strokeWidth="3"
            strokeDasharray={107}
            strokeDashoffset={107 - (107 * percentage) / 100}
          />
        </svg>
        <span className="text-[10px] font-headline font-black text-primary">
          {(timeLeft / 1000).toFixed(1)}s
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-headline font-black text-on-surface uppercase">Đang chờ Nope...</span>
        <span className="text-[9px] text-on-surface-variant font-bold leading-tight">Bạn có muốn chặn lá bài vừa đánh không?</span>
      </div>

      {hasNopeCard && (
        <button
          onClick={onPlayNope}
          className="bg-secondary text-on-error font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-4 py-2 rounded-xl text-[10px] hover:scale-105 active:scale-95 transition-all uppercase"
        >
          Đánh NOPE! ❌
        </button>
      )}
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
          <h3 className="text-2xl font-headline font-black text-primary uppercase">🪦 Chôn Bài (Bury Card)</h3>
          <p className="text-xs font-bold text-on-surface-variant mt-1">
            Chọn 1 lá bài từ tay của bạn và chọn vị trí chôn trong bộ bài bốc. Lượt chơi của bạn sẽ kết thúc.
          </p>
        </div>

        {/* Card selection */}
        <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-center max-w-full hide-scroll">
          {hand.map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedId(card.id)}
                className="transform transition-transform cursor-pointer flex-shrink-0"
              >
                <Card type={card.type} selected={isSelected} />
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
            Xác nhận Chôn Bài 🪦
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

        <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-center max-w-full hide-scroll">
          {hand.map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedId(card.id)}
                className="transform transition-transform cursor-pointer flex-shrink-0"
              >
                <Card type={card.type} selected={isSelected} />
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
            Nộp Lá Bài Đã Chọn ✉️
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
                    <span className="text-2xl">💀</span>
                    <div className="text-left flex flex-col">
                      <span className="text-xs font-headline font-black text-on-surface uppercase">{p.userId}</span>
                      <span className="text-[10px] font-bold text-slate-400">TRẠNG THÁI: HỒN MA</span>
                    </div>
                  </div>
                  {isSelected && <span className="text-xl">✅</span>}
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
