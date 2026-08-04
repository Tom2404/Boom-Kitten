import React from 'react';
import { PixelDialogShell } from './ui/PixelDialogShell.jsx';

export default function CustomDialog({
  isOpen,
  title,
  message,
  isConfirm = false,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  tone = 'neutral',
  confirmDisabled = false,
  busy = false,
}) {
  return (
    <PixelDialogShell
      isOpen={isOpen}
      title={title || 'Thông báo'}
      description={message}
      tone={tone}
      variant="paper"
      dismissible={Boolean(onCancel)}
      onClose={onCancel}
      maxWidth="max-w-md"
      footer={(
        <>
          {isConfirm && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="pixel-dialog__button pixel-dialog__button--muted"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled || busy}
            aria-busy={busy}
            className="pixel-dialog__button pixel-dialog__button--primary"
          >
            {confirmText}
          </button>
        </>
      )}
    >
      {busy && (
        <p className="pixel-dialog__busy" role="status">
          PROCESSING<span aria-hidden="true">...</span>
        </p>
      )}
    </PixelDialogShell>
  );
}
