import React from 'react';

const RANK_BADGES = {
  Bronze: '🟫 BRONZE',
  Silver: '⬜ SILVER',
  Gold: '🟨 GOLD',
  Diamond: '🔷 DIAMOND',
  Legend: '👑 LEGEND',
};

const PRESET_AVATARS = {
  angry_kitten: '😿',
  crown_kitten: '👑',
  space_kitten: '🚀',
  bomb_kitten: '💣',
  sleepy_kitten: '😴',
  cool_kitten: '😎',
};

export default function PlayerAvatar({
  player,
  isCurrentTurn,
  isTargetable,
  isSelectedTarget,
  onSelectTarget,
  publicProfile,
}) {
  const { userId, username, alive, handCount, avatar, activeAvatarFrame, eloPoints, rank } = player;

  const handleSelect = () => {
    if (isTargetable && onSelectTarget) {
      onSelectTarget(userId);
    }
  };

  const currentRank = rank || publicProfile?.rank || 'Bronze';
  const currentElo = eloPoints || publicProfile?.eloPoints || 1000;

  return (
    <div
      onClick={handleSelect}
      className={`relative p-3 rounded-2xl flex flex-col items-center justify-between border-3 border-on-surface w-36 transition-all duration-100 select-none
        ${alive 
          ? 'bg-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]' 
          : 'bg-surface-dim opacity-50 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]'}
        ${isCurrentTurn && alive 
          ? 'ring-4 ring-primary border-primary animate-pulse' 
          : ''}
        ${isTargetable && alive 
          ? 'cursor-pointer border-dashed hover:-translate-y-1' 
          : ''}
        ${isSelectedTarget && alive 
          ? 'ring-4 ring-yellow-400 border-yellow-400 -translate-y-1' 
          : ''}`}
    >
      {/* Player Frame & Image Container */}
      <div className="relative h-16 w-16 mb-2">
        {/* Avatar Frame (if any) */}
        {activeAvatarFrame && alive && (
          <div className="absolute inset-[-6px] rounded-full border-4 border-yellow-400 animate-spin-slow pointer-events-none z-10" />
        )}
        
        {/* Profile Image / Initials */}
        <div className={`h-full w-full rounded-full flex items-center justify-center text-xl font-headline font-black bg-primary-fixed border-2 border-on-surface overflow-hidden shadow-inner
          ${!alive ? 'grayscale' : ''}`}>
          {avatar && PRESET_AVATARS[avatar] ? (
            <span className="text-3xl">{PRESET_AVATARS[avatar]}</span>
          ) : avatar ? (
            <img src={avatar} alt={username} className="h-full w-full object-cover" />
          ) : (
            <span>{username ? username.slice(0, 2).toUpperCase() : '?'}</span>
          )}
        </div>

        {/* Dead Overlay */}
        {!alive && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
            <span className="text-2xl filter drop-shadow">💀</span>
          </div>
        )}
      </div>

      {/* Name and Rank Details */}
      <div className="w-full text-center">
        <h4 className="text-xs font-headline font-black text-on-surface truncate max-w-full px-1">{username || userId}</h4>
        <span className="text-[9px] font-headline font-black text-primary block tracking-wider uppercase">
          {RANK_BADGES[currentRank] || currentRank}
        </span>
        <span className="text-[9px] font-mono font-bold text-on-surface-variant block">
          {currentElo} ELO
        </span>
      </div>

      {/* Cards remaining indicator (for opponents) */}
      {alive && handCount !== undefined && (
        <div className="mt-2 bg-surface-container-high border-2 border-on-surface px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(26,28,28,1)]">
          <span className="text-[9px] font-headline font-bold text-on-surface-variant">CARDS:</span>
          <span className="text-[10px] font-headline font-black text-primary">{handCount}</span>
        </div>
      )}

      {/* Dead Tag */}
      {!alive && (
        <span className="mt-2 px-2 py-0.5 bg-secondary text-on-error border-2 border-on-surface rounded text-[9px] font-headline font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(26,28,28,1)]">
          ĐÃ LOẠI
        </span>
      )}

      {/* Turn indicator text */}
      {isCurrentTurn && alive && (
        <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-primary text-on-primary font-headline font-black text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow border-2 border-on-surface">
          LƯỢT ĐI
        </span>
      )}

      {/* Select target indicator */}
      {isTargetable && alive && !isSelectedTarget && (
        <span className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-950 font-headline font-black text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow border-2 border-on-surface animate-bounce">
          CHỌN MỤC TIÊU
        </span>
      )}
    </div>
  );
}
export { PRESET_AVATARS };
