import React from 'react';
import TurnStatusBanner from './TurnStatusBanner.jsx';
import OpponentTableSeats from './OpponentTableSeats.jsx';
import OpponentRail from './OpponentRail.jsx';

export default function GameTableCore({
  DeckPile,
  DiscardPile,
  PlayerAvatar,
  deckCount,
  displayedDiscardPile,
  drawCard,
  edition,
  isDrawDisabled,
  isMyTurn,
  isOpponentTargetable,
  layoutMode,
  myUserId,
  onClearTarget,
  onSelectDiscard,
  onSelectTarget,
  opponents,
  pendingCombo5,
  playDirection,
  protectorUrl,
  protectorTransform,
  reversePulse,
  selectedTargetId,
  interactionState,
  targetName,
  topCard,
  waitingHolderId,
}) {
  const isClockwise = playDirection !== -1;

  return (
    <section className="game-table-core" aria-label="Bàn đấu">
      <div id="board-center-target" className="game-table-core__vfx-target" aria-hidden="true" />
      
      {/* Opponents seated around the table */}
      {layoutMode === 'rail' ? (
        <OpponentRail
          PlayerAvatar={PlayerAvatar}
          activePlayerId={interactionState?.activePlayerId}
          edition={edition}
          opponents={opponents}
          isOpponentTargetable={isOpponentTargetable}
          selectedTargetId={selectedTargetId}
          waitingHolderId={waitingHolderId}
          onSelectTarget={onSelectTarget}
        />
      ) : (
        <OpponentTableSeats
          opponents={opponents}
          activePlayerId={interactionState?.activePlayerId}
          edition={edition}
          isOpponentTargetable={isOpponentTargetable}
          selectedTargetId={selectedTargetId}
          waitingHolderId={waitingHolderId}
          onSelectTarget={onSelectTarget}
        />
      )}

      {/* Turn & Interaction Status Banner */}
      <TurnStatusBanner
        interactionState={interactionState}
        targetName={targetName}
        onClearTarget={onClearTarget}
      />

      {/* Outer Direction Path along table border */}
      <div className={`direction-path ${isClockwise ? 'direction-path--cw' : 'direction-path--ccw'} ${reversePulse ? 'direction-path--pulse' : ''}`} aria-hidden="true">
        <span className="direction-path__arrow direction-path__arrow--top" />
        <span className="direction-path__arrow direction-path__arrow--right" />
        <span className="direction-path__arrow direction-path__arrow--left" />
      </div>

      <div className="game-table-core__piles">
        {/* Draw Pile Container with VFX Anchor */}
        <div className="game-table-pile game-table-pile--draw" data-vfx-anchor="draw-pile">
          <DeckPile
            count={deckCount}
            topCard={topCard}
            onDraw={drawCard}
            isMyTurn={isMyTurn}
            disabled={isDrawDisabled}
            compact
            protectorUrl={protectorUrl}
            protectorTransform={protectorTransform}
          />
        </div>

        {/* Play Direction Indicator */}
        <div
          className={`game-table-core__flow ${reversePulse ? 'game-table-core__flow--pulse' : ''}`}
          aria-label={isClockwise ? 'Chiều chơi thuận kim đồng hồ' : 'Chiều chơi ngược kim đồng hồ'}
        >
          <span className="game-table-core__flow-icon">{isClockwise ? '↷' : '↶'}</span>
          <small className="game-table-core__flow-tag">{isClockwise ? 'CW' : 'CCW'}</small>
        </div>

        {/* Discard Pile Container with VFX Anchor */}
        <div className="game-table-pile game-table-pile--discard" data-vfx-anchor="discard-pile">
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
