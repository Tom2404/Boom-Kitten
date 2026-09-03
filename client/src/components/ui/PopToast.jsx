import React, { useEffect, useState } from 'react';

/**
 * Single Pop-Art Toast Item component with countdown progress bar
 */
export function PopToastItem({ toast, onClose }) {
  const { id, type = 'info', title, message, duration = 4000 } = toast;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (duration <= 0) return;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            onClose(id);
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [id, duration, isPaused, onClose]);

  // Color schemes according to Pop-Art Territory tokens
  const typeConfig = {
    success: {
      bg: 'bg-white',
      accentBg: 'bg-[var(--pop-green)]',
      textColor: 'text-[var(--pop-black)]',
      icon: '🎉',
      defaultTitle: 'THÀNH CÔNG',
      borderColor: 'border-[var(--pop-black)]',
      progressColor: 'bg-[var(--pop-green)]',
    },
    error: {
      bg: 'bg-white',
      accentBg: 'bg-[var(--pop-red)]',
      textColor: 'text-[var(--pop-black)]',
      icon: '🚫',
      defaultTitle: 'LỖI',
      borderColor: 'border-[var(--pop-black)]',
      progressColor: 'bg-[var(--pop-red)]',
    },
    warning: {
      bg: 'bg-white',
      accentBg: 'bg-[var(--pop-amber)]',
      textColor: 'text-[var(--pop-black)]',
      icon: '⚠️',
      defaultTitle: 'LƯU Ý',
      borderColor: 'border-[var(--pop-black)]',
      progressColor: 'bg-[var(--pop-amber)]',
    },
    info: {
      bg: 'bg-white',
      accentBg: 'bg-sky-400',
      textColor: 'text-[var(--pop-black)]',
      icon: '💡',
      defaultTitle: 'THÔNG BÁO',
      borderColor: 'border-[var(--pop-black)]',
      progressColor: 'bg-sky-500',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="alert"
      className={`relative w-full max-w-sm sm:max-w-md ${config.bg} border-3 ${config.borderColor} shadow-[4px_4px_0_var(--pop-black)] overflow-hidden font-pop-body select-none transition-all duration-200 animate-fadeIn`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header Accent Strip */}
      <div className={`flex items-center justify-between px-3 py-1.5 ${config.accentBg} border-b-2 border-[var(--pop-black)] text-white font-pop-accent font-black text-xs uppercase tracking-wider`}>
        <div className="flex items-center gap-1.5 text-[var(--pop-black)]">
          <span>{config.icon}</span>
          <span>{title || config.defaultTitle}</span>
        </div>
        <button
          type="button"
          onClick={() => onClose(id)}
          className="w-5 h-5 flex items-center justify-center bg-[var(--pop-black)] text-white hover:bg-white hover:text-[var(--pop-black)] border border-[var(--pop-black)] font-bold text-xs transition-colors cursor-pointer"
          aria-label="Đóng thông báo"
        >
          ✕
        </button>
      </div>

      {/* Message Body */}
      <div className="p-3 text-xs sm:text-sm font-bold text-[var(--pop-black)] leading-relaxed">
        {message}
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="w-full h-1 bg-black/10">
          <div
            className={`h-full ${config.progressColor} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Toast Container positioned in top-right screen
 */
export default function PopToastContainer({ toasts = [], onCloseToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-18 sm:top-20 right-3 sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-auto max-w-[calc(100vw-24px)]"
    >
      {toasts.map((toast) => (
        <PopToastItem key={toast.id} toast={toast} onClose={onCloseToast} />
      ))}
    </div>
  );
}
