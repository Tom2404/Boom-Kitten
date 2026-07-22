import React from 'react';

export default function GameTableCore({
  DeckPile,
  DiscardPile,
  deckCount,
  displayedDiscardPile,
  drawCard,
  isDrawDisabled,
  isMyTurn,
  myUserId,
  onSelectDiscard,
  pendingCombo5,
  playDirection,
  reversePulse,
  statusMessage,
  topCard,
  targetName,
  onClearTarget,
}) {
  return (
    <section className="game-table-core" aria-label="Bàn đấu">
      <div id="board-center-target" className="game-table-core__vfx-target" aria-hidden="true" />
      <div className={`game-direction-mark ${reversePulse ? 'game-direction-mark--pulse' : ''}`} aria-hidden="true">
        <img
          src="/vfx/reverse-arrow.png"
          alt=""
          className={playDirection === -1 ? 'is-counter-clockwise' : 'is-clockwise'}
        />
      </div>

      <div className="game-table-core__status" role="status" aria-live="polite">
        <span className="game-pixel-spark" aria-hidden="true" />
        <p>{statusMessage}</p>
        {targetName && (
          <button type="button" onClick={onClearTarget} aria-label={`Bỏ chọn ${targetName}`}>
            Mục tiêu: <strong>{targetName}</strong> <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      <div className="game-table-core__piles">
        <div className="game-table-pile game-table-pile--draw">
          <DeckPile
            count={deckCount}
            topCard={topCard}
            onDraw={drawCard}
            isMyTurn={isMyTurn}
            disabled={isDrawDisabled}
            compact
          />
        </div>
        <span className="game-table-core__flow" aria-label={playDirection === -1 ? 'Chiều chơi ngược kim đồng hồ' : 'Chiều chơi theo kim đồng hồ'}>
          {playDirection === -1 ? '‹' : '›'}
        </span>
        <div className="game-table-pile game-table-pile--discard">
          <DiscardPile
            discardPile={displayedDiscardPile}
            pendingCombo5={pendingCombo5}
            myUserId={myUserId}
            onSelectCard={onSelectDiscard}
            compact
          />
        </div>
      </div>
    </section>
  );
}

