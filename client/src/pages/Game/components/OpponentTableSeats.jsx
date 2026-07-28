import React from 'react';
import PlayerAvatar from '../../../components/PlayerAvatar.jsx';
import { getOpponentSeatClass } from '../../../utils/seatAllocation.js';

export default function OpponentTableSeats({
  opponents,
  activePlayerId,
  edition,
  isOpponentTargetable,
  selectedTargetId,
  waitingHolderId,
  onSelectTarget,
}) {
  if (!opponents || opponents.length === 0) return null;

  const totalOpponents = opponents.length;

  return (
    <div className="game-opponents-horseshoe" aria-label="Đối thủ quanh bàn">
      {opponents.map((opponent, index) => {
        const seatClass = getOpponentSeatClass(index, totalOpponents);
        return (
          <div key={opponent.userId} className={`game-opponent-seat-wrapper ${seatClass}`}>
            <PlayerAvatar
              player={opponent}
              compact
              isCurrentTurn={activePlayerId === opponent.userId}
              isTargetable={isOpponentTargetable(opponent.userId)}
              isSelectedTarget={selectedTargetId === opponent.userId}
              onSelectTarget={onSelectTarget}
              edition={edition}
              isWaitingBK={waitingHolderId === opponent.userId}
            />
          </div>
        );
      })}
    </div>
  );
}
