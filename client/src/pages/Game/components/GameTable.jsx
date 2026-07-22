import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import GameTableCore from './GameTableCore.jsx';
import OpponentRail from './OpponentRail.jsx';
import PlayerHandDock from './PlayerHandDock.jsx';
import TurnBanner from './TurnBanner.jsx';

export default function GameTable(props) {
  const context = useGameContext();
  const {
    DeckPile,
    DiscardPile,
    PlayerAvatar,
    PlayerHand,
    activePlayerId,
    discardCard,
    displayedDiscardPile,
    displayState,
    drawCard,
    gameState,
    getOrderedOpponents,
    getStatusDisplay,
    isMyTurn,
    isOpponentTargetable,
    myUser,
    nopeWindow,
    opponents,
    playCard,
    playCombo,
    privateHand,
    respondCombo5,
    reversePulse,
  } = { ...context, ...props };
  const [targetPlayerId, setTargetPlayerId] = React.useState(null);

  const targetName = targetPlayerId
    ? opponents.find((opponent) => opponent.userId === targetPlayerId)?.username || targetPlayerId
    : null;
  const isDrawDisabled = Boolean(
    gameState.pendingFavor
    || gameState.pendingAlter
    || nopeWindow?.active
    || privateHand.length > (gameState.maxHandSize ?? 10),
  );

  const handleSelectTarget = (playerId) => {
    setTargetPlayerId((current) => current === playerId ? null : playerId);
  };

  return (
    <div id="game-board-container" className="game-board">
      <div className="game-board__hud">
        <TurnBanner state={displayState} />
        <OpponentRail
          PlayerAvatar={PlayerAvatar}
          activePlayerId={activePlayerId}
          edition={gameState.edition}
          getOrderedOpponents={getOrderedOpponents}
          isOpponentTargetable={isOpponentTargetable}
          selectedTargetId={targetPlayerId}
          waitingHolderId={gameState.barkingKittenState?.waitingHolder}
          onSelectTarget={handleSelectTarget}
        />
      </div>
      <GameTableCore
        DeckPile={DeckPile}
        DiscardPile={DiscardPile}
        deckCount={gameState.deckCount ?? 0}
        displayedDiscardPile={displayedDiscardPile}
        drawCard={drawCard}
        isDrawDisabled={isDrawDisabled}
        isMyTurn={isMyTurn}
        myUserId={myUser.id}
        onSelectDiscard={respondCombo5}
        pendingCombo5={gameState.pendingCombo5}
        playDirection={gameState.playDirection}
        reversePulse={reversePulse}
        statusMessage={getStatusDisplay()}
        topCard={gameState.topCard}
        targetName={targetName}
        onClearTarget={() => setTargetPlayerId(null)}
      />
      <PlayerHandDock
        PlayerHand={PlayerHand}
        discardCard={discardCard}
        drawsRequired={gameState.drawsRequired}
        gameState={gameState}
        isMyTurn={isMyTurn}
        myUser={myUser}
        nopeWindow={nopeWindow}
        playCard={playCard}
        playCombo={playCombo}
        privateHand={privateHand}
        targetPlayerId={targetPlayerId}
      />
    </div>
  );
}
