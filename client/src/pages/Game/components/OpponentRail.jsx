import React from 'react';

export default function OpponentRail({
  PlayerAvatar,
  activePlayerId,
  edition,
  getOrderedOpponents,
  isOpponentTargetable,
  selectedTargetId,
  waitingHolderId,
  onSelectTarget,
}) {
  const opponents = getOrderedOpponents();
  const hasTarget = opponents.some((opponent) => isOpponentTargetable(opponent.userId));

  return (
    <section className="game-opponent-rail" aria-label="Đối thủ trong phòng">
      <div className="game-opponent-rail__label" aria-hidden="true">
        <span>Đối thủ</span>
        <small>{opponents.length}</small>
      </div>
      <div className="game-opponent-rail__scroller">
        {opponents.map((opponent) => (
          <PlayerAvatar
            key={opponent.userId}
            player={opponent}
            compact
            isCurrentTurn={activePlayerId === opponent.userId}
            isTargetable={isOpponentTargetable(opponent.userId)}
            isSelectedTarget={selectedTargetId === opponent.userId}
            onSelectTarget={onSelectTarget}
            edition={edition}
            isWaitingBK={waitingHolderId === opponent.userId}
          />
        ))}
      </div>
      {hasTarget && (
        <p className="game-opponent-rail__hint" role="status">
          Chọn đối thủ để áp dụng lá bài
        </p>
      )}
    </section>
  );
}
