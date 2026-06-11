import React, { useState, useEffect } from 'react';
import Card from './Card.jsx';

// ==========================================
// 1. SEE THE FUTURE MODAL
// ==========================================
export function SeeFutureModal({ cards, onClose }) {
  if (!cards) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-violet-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
        <div>
          <h3 className="text-xl font-bold text-violet-400 flex items-center justify-center gap-2">
            👁️ Tiên Tri (See the Future)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Đây là {cards.length} lá bài trên cùng bộ bài bốc (từ trái qua phải - từ trên xuống dưới).
          </p>
        </div>

        <div className="flex gap-4 justify-center items-center py-4 flex-wrap">
          {cards.map((card, index) => (
            <div key={card.id || index} className="relative group">
              <Card type={card.type} />
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-violet-400">
                Thứ {index + 1}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all duration-300"
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
    // Return array of card IDs in the new order (top to bottom)
    // Server expects cards from top to bottom (index 0 is top)
    onConfirm(order.map((c) => c.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-pink-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-6 text-center">
        <div>
          <h3 className="text-xl font-bold text-pink-400 flex items-center justify-center gap-2">
            🌀 Định Đoạt (Alter the Future)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Thay đổi thứ tự 3 lá bài trên cùng bộ bài bốc. Sắp xếp từ trái qua phải (lá đầu tiên nằm bên trái).
          </p>
        </div>

        <div className="flex gap-6 justify-center items-stretch py-4">
          {order.map((card, index) => (
            <div key={card.id || index} className="flex flex-col items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-pink-300 font-mono">
                {index === 0 ? 'HÀNG ĐẦU (Top)' : `Vị trí ${index + 1}`}
              </span>
              
              <Card type={card.type} />
              
              <div className="flex gap-2">
                <button
                  onClick={() => moveLeft(index)}
                  disabled={index === 0}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-xs rounded font-bold text-white transition-colors"
                >
                  ◀
                </button>
                <button
                  onClick={() => moveRight(index)}
                  disabled={index === order.length - 1}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-xs rounded font-bold text-white transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          className="px-8 py-2.5 rounded-lg font-bold bg-pink-600 hover:bg-pink-500 text-white transition-all duration-300 shadow-lg shadow-pink-500/20 active:scale-95"
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
export function FavorRequestModal({ fromPlayerId, hand, onRespond }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleSend = () => {
    if (!selectedId) return;
    onRespond(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-yellow-600 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-yellow-500">🤲 Bạn Bị Xin Bài! (Favor Request)</h3>
          <p className="text-xs text-slate-400">
            Người chơi <strong className="text-white">{fromPlayerId}</strong> đã đánh lá Favor nhắm vào bạn. Hãy chọn **1 lá** để trao cho họ.
          </p>
        </div>

        <div className="flex-1 overflow-x-auto flex gap-4 pb-4 pt-6 justify-center">
          {hand.map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedId(card.id)}
                className="transform transition-transform cursor-pointer"
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
            className={`px-8 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all duration-300
              ${selectedId 
                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 active:scale-95 shadow-yellow-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'}`}
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
export function NopeCountdown({ eventId, timeoutMs, hasNopeCard, onPlayNope }) {
  const [timeLeft, setTimeLeft] = useState(timeoutMs);

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
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/90 border border-red-500 rounded-full px-6 py-2.5 shadow-2xl flex items-center gap-4 backdrop-blur-md animate-bounce">
      {/* Circle countdown visual */}
      <div className="relative h-8 w-8 flex items-center justify-center">
        <svg className="absolute inset-0 h-full w-full transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            className="stroke-slate-800 fill-transparent"
            strokeWidth="3"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            className="stroke-red-500 fill-transparent transition-all duration-75"
            strokeWidth="3"
            strokeDasharray={88}
            strokeDashoffset={88 - (88 * percentage) / 100}
          />
        </svg>
        <span className="text-[10px] font-bold font-mono text-red-400">
          {(timeLeft / 1000).toFixed(1)}s
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-bold text-white uppercase tracking-wider">Đang chờ Nope...</span>
        <span className="text-[10px] text-slate-400">Bạn có muốn chặn lá bài vừa đánh không?</span>
      </div>

      {hasNopeCard && (
        <button
          onClick={onPlayNope}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 border border-red-400 active:scale-95 transition-all duration-300"
        >
          ❌ Đánh NOPE!
        </button>
      )}
    </div>
  );
}
