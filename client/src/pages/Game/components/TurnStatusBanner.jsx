import React from 'react';

export default function TurnStatusBanner({ interactionState, targetName, onClearTarget }) {
  if (!interactionState) return null;

  const { mode, message } = interactionState;

  return (
    <div className={`turn-status-banner turn-status-banner--${mode}`} role="status" aria-live="polite">
      <span className="game-pixel-spark" aria-hidden="true" />
      <p className="turn-status-banner__text">{message}</p>

      {targetName && (
        <button
          type="button"
          className="turn-status-banner__target-tag"
          onClick={onClearTarget}
          aria-label={`Bỏ chọn ${targetName}`}
        >
          Mục tiêu: <strong>{targetName}</strong> <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
