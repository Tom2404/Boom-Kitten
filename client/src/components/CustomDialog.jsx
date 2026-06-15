import React from 'react';
import { createPortal } from 'react-dom';

export default function CustomDialog({
  isOpen,
  title,
  message,
  isConfirm = false,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 animate-fade-in text-slate-900">
      <div className="w-full max-w-md bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-center">
        <div>
          <h3 className="text-xl font-headline font-black text-primary uppercase">
            {title || 'Thông báo'}
          </h3>
          <p className="text-xs font-bold text-on-surface-variant mt-3 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        <div className="flex gap-4 justify-center mt-2">
          {isConfirm && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-surface border-3 border-on-surface hover:bg-slate-100 rounded-2xl font-headline font-black uppercase text-xs transition-all shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] active:translate-y-0.5 active:shadow-none"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 py-3 btn-detonator rounded-2xl font-headline font-black uppercase text-xs"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
