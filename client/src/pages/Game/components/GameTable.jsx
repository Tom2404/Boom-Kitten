import React, { useState, useEffect, useRef } from 'react';
import { useGameContext } from '../GameContext.jsx';
import GameTableCore from './GameTableCore.jsx';
import PlayerHandDock from './PlayerHandDock.jsx';
import { calculateRelativeOpponents } from '../../../utils/seatAllocation.js';
import { getInteractionState } from '../../../utils/interactionState.js';
import { getEquippedAssetUrl, getFieldTransformStyle } from '../../../utils/shopEquipment.js';

export default function GameTable(props) {
  const context = useGameContext();
  const {
    DeckPile,
    DiscardPile,
    PlayerAvatar,
    PlayerHand,
    activePlayerId,
    combo3Request,
    discardCard,
    displayedDiscardPile,
    drawCard,
    equippedCosmetics,
    gameState,
    getStatusDisplay,
    isDrawPending,
    isMyTurn,
    isOpponentTargetable,
    myUser,
    nopeWindow,
    playCard,
    playCombo,
    privateHand,
    respondCombo3,
    respondCombo5,
    reversePulse,
  } = { ...context, ...props };

  const [targetPlayerId, setTargetPlayerId] = useState(null);
  const [layoutMode, setLayoutMode] = useState('horseshoe-large');
  const containerRef = useRef(null);
  const field = equippedCosmetics?.field;
  const protector = equippedCosmetics?.protector;
  const fieldUrl = getEquippedAssetUrl(field);
  const protectorUrl = getEquippedAssetUrl(protector);

  const relativeOpponents = calculateRelativeOpponents(gameState.players, myUser.id);
  const localPlayer = gameState.players.find((player) => player.userId === myUser.id);
  const totalOpponents = relativeOpponents.length;

  // Responsive Layout detection using ResizeObserver
  useEffect(() => {
    const el = containerRef.current || document.getElementById('game-board-container');
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width < 640 || height < 500) {
          setLayoutMode('rail');
        } else if (width < 960 || totalOpponents > 4) {
          setLayoutMode('horseshoe-compact');
        } else {
          setLayoutMode('horseshoe-large');
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [totalOpponents]);

  const targetName = targetPlayerId
    ? gameState.players?.find((opponent) => opponent.userId === targetPlayerId)?.username || targetPlayerId
    : null;

  const interactionState = {
    ...getInteractionState({
      gameState,
      myUserId: myUser.id,
      privateHand,
      nopeWindow,
    }),
    activePlayerId,
  };

  const isDrawDisabled = Boolean(
    gameState.pendingFavor
    || gameState.pendingAlter
    || isDrawPending
    || nopeWindow?.active
    || privateHand.length > (gameState.maxHandSize ?? 10),
  );

  const handleSelectTarget = (playerId) => {
    setTargetPlayerId((current) => current === playerId ? null : playerId);
  };

  return (
    <div
      id="game-board-container"
      ref={containerRef}
      className={`game-board game-stage ${fieldUrl ? 'game-board--custom-field' : ''}`}
      data-layout={layoutMode}
      style={fieldUrl ? { '--game-field-image': `url("${fieldUrl}")`, ...getFieldTransformStyle(field.assetTransform) } : undefined}
    >
      <GameTableCore
        DeckPile={DeckPile}
        DiscardPile={DiscardPile}
        PlayerAvatar={PlayerAvatar}
        deckCount={gameState.deckCount ?? 0}
        displayedDiscardPile={displayedDiscardPile}
        drawCard={drawCard}
        edition={gameState.edition}
        isDrawDisabled={isDrawDisabled}
        isMyTurn={isMyTurn}
        isOpponentTargetable={isOpponentTargetable}
        layoutMode={layoutMode}
        myUserId={myUser.id}
        onClearTarget={() => setTargetPlayerId(null)}
        onSelectDiscard={respondCombo5}
        onSelectTarget={handleSelectTarget}
        opponents={relativeOpponents}
        pendingCombo5={gameState.pendingCombo5}
        playDirection={gameState.playDirection}
        protectorUrl={protectorUrl}
        protectorTransform={protector?.assetTransform}
        reversePulse={reversePulse}
        selectedTargetId={targetPlayerId}
        interactionState={interactionState}
        targetName={targetName}
        topCard={gameState.topCard}
        waitingHolderId={gameState.barkingKittenState?.waitingHolder}
      />

      <PlayerHandDock
        PlayerHand={PlayerHand}
        combo3Request={combo3Request}
        discardCard={discardCard}
        drawsRequired={gameState.drawsRequired}
        gameState={gameState}
        isDrawPending={isDrawPending}
        isMyTurn={isMyTurn}
        myUser={myUser}
        player={localPlayer}
        nopeWindow={nopeWindow}
        playCard={playCard}
        playCombo={playCombo}
        privateHand={privateHand}
        respondCombo3={respondCombo3}
        targetPlayerId={targetPlayerId}
      />
    </div>
  );
}
