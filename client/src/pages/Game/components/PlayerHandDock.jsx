import React from 'react';

export default function PlayerHandDock({
  PlayerHand,
  discardCard,
  drawsRequired,
  gameState,
  isMyTurn,
  myUser,
  nopeWindow,
  playCard,
  playCombo,
  privateHand,
  targetPlayerId,
}) {
  return (
    <section className="game-player-dock" aria-label="Khu vực bài của bạn">
      <div className="game-player-dock__identity">
        <span className="game-player-dock__sprite" aria-hidden="true">BK</span>
        <span>
          <small>Bạn đang chơi</small>
          <strong>{myUser.username || 'Bạn'}</strong>
        </span>
        <b>{isMyTurn ? `Bốc ${drawsRequired} lá` : 'Chờ lượt'}</b>
      </div>
      <PlayerHand
        hand={privateHand}
        onPlayCard={playCard}
        onPlayCombo={playCombo}
        isMyTurn={isMyTurn}
        targetPlayerId={targetPlayerId}
        nopeWindowActive={Boolean(nopeWindow?.active)}
        onDiscard={discardCard}
        maxHandSize={gameState.maxHandSize ?? 10}
        players={gameState.players || []}
        myUserId={myUser.id}
      />
      {privateHand.length > 5 && (
        <p className="game-hand__swipe-hint" aria-hidden="true">Vuốt ngang để xem toàn bộ bài</p>
      )}
    </section>
  );
}
