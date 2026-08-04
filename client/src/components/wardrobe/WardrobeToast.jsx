import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function WardrobeToast({ toast, onClose, onAction }) {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPaused(false);
  }, [toast?.id]);

  useEffect(() => {
    if (!toast || toast.tone === 'error' || paused) return undefined;
    const timeout = window.setTimeout(onClose, 5_000);
    return () => window.clearTimeout(timeout);
  }, [toast, paused, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`wardrobe-toast fixed right-3 top-[76px] z-[70] w-[min(24rem,calc(100vw-1.5rem))] border-3 border-[var(--pop-black)] p-4 shadow-[5px_5px_0_var(--pop-black)] ${toast.tone === 'error' ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--wardrobe-surface)]'}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[var(--pop-black)] font-pixel text-sm font-black ${toast.tone === 'error' ? 'bg-white text-[var(--pop-red)]' : 'bg-[var(--pop-green)] text-white'}`} aria-hidden="true">
          {toast.tone === 'error' ? '!' : '✓'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{toast.message}</p>
          <p className={`mt-1 text-xs font-bold ${toast.tone === 'error' ? 'text-white/80' : 'text-[var(--pop-black)]/60'}`}>
            {toast.tone === 'error' ? t('wardrobe_error_hint') : t('wardrobe_success_hint')}
          </p>
          {toast.action && (
            <button type="button" onClick={() => onAction(toast.action)} className={`mt-3 border-2 border-[var(--pop-black)] px-3 py-1.5 font-pixel text-[10px] font-black uppercase shadow-[2px_2px_0_var(--pop-black)] ${toast.tone === 'error' ? 'bg-white text-[var(--pop-black)]' : 'bg-[var(--pop-amber)]'}`}>
              {toast.action.kind === 'undo' ? t('wardrobe_undo') : t('wardrobe_retry_action')}
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className="shrink-0 px-1 font-pixel text-lg font-black" aria-label={t('wardrobe_close_toast')}>×</button>
      </div>
    </div>
  );
}
