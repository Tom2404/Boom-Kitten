import React from 'react';
import Card from './Card.jsx';

export default function DeckPile({ count, topCard, onDraw, isMyTurn, disabled, compact = false }) {
  const handleDraw = () => {
    if (isMyTurn && !disabled) {
      onDraw();
    }
  };

  const isClickable = isMyTurn && !disabled;

  const hasFaceUpCard = topCard && topCard.faceUp;

  // Dynamic stack layers based on remaining deck count
  const stackLayers = Math.min(Math.ceil(count / 8), 4);

  return (
    <div className={`game-pile game-pile--draw ${compact ? 'game-pile--compact' : ''}`}>
      <span className="game-pile__label">Bài bốc</span>
      
      <div
        id="deck-pile-element"
        onClick={handleDraw}
        onKeyDown={(event) => {
          if (!isClickable || !['Enter', ' '].includes(event.key)) return;
          event.preventDefault();
          handleDraw();
        }}
        role="button"
        tabIndex={isClickable ? 0 : -1}
        aria-disabled={!isClickable}
        aria-label={isClickable ? `Bốc một lá, còn ${count} lá` : `Chồng bài bốc còn ${count} lá`}
        className={`game-pile__card ${hasFaceUpCard ? 'game-pile__card--face-up' : ''}`}
      >
        {/* Dynamic 3D stack effect — layers scale with card count */}
        {stackLayers >= 1 && count > 1 && (
          <span className="game-pile__layer game-pile__layer--one" aria-hidden="true" />
        )}
        {stackLayers >= 2 && (
          <span className="game-pile__layer game-pile__layer--two" aria-hidden="true" />
        )}
        {stackLayers >= 3 && (
          <span className="game-pile__layer game-pile__layer--three" aria-hidden="true" />
        )}
        {stackLayers >= 4 && (
          <span className="game-pile__layer game-pile__layer--four" aria-hidden="true" />
        )}

        {/* Custom Spikey Starburst SVG or Face-Up top card */}
        {hasFaceUpCard ? (
          <span className="game-pile__face-up">
            <Card type={topCard.type} disabled={false} compact={compact} />
          </span>
        ) : (
          <span className="game-pile__back">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z" />
            </svg>
            <span>Mèo nổ</span>
          </span>
        )}

        {/* Floating badge for card count - black with white text */}
        <span className="game-pile__count" aria-hidden="true">
          {count}
        </span>

        {/* Draw arrow indicator when clickable */}
        {isClickable && (
          <span className="game-pile__draw-cue" aria-hidden="true">Bốc</span>
        )}
      </div>

      <span className={`game-pile__hint ${isClickable ? 'game-pile__hint--active' : ''}`}>
        {isClickable ? 'Bốc bài để kết lượt' : 'Đang chờ lượt'}
      </span>
    </div>
  );
}
