import React from 'react';

const RANK_BADGES = {
  Bronze: '🟫 BRONZE',
  Silver: '⬜ SILVER',
  Gold: '🟨 GOLD',
  Diamond: '🔷 DIAMOND',
  Legend: '👑 LEGEND',
};

export default function PlayerAvatar({
  player,
  isCurrentTurn,
  isTargetable,
  isSelectedTarget,
  onSelectTarget,
  publicProfile, // optional DB profile details
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
      className={`relative p-3 rounded-2xl flex flex-col items-center justify-between border-2 w-36 transition-all duration-300 select-none
        ${alive 
          ? 'bg-slate-900/80 border-slate-800' 
          : 'bg-slate-950/60 border-slate-950 opacity-40'}
        ${isCurrentTurn && alive 
          ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20 border-emerald-400' 
          : ''}
        ${isTargetable && alive 
          ? 'cursor-pointer hover:border-yellow-400 border-dashed animate-pulse' 
          : ''}
        ${isSelectedTarget && alive 
          ? 'ring-4 ring-yellow-400 border-yellow-400 scale-105' 
          : ''}`}
    >
      {/* Player Frame & Image Container */}
      <div className="relative h-16 w-16 mb-2">
        {/* Avatar Frame (if any) */}
        {activeAvatarFrame && alive && (
          <div className="absolute inset-[-6px] rounded-full border-4 border-yellow-400 animate-spin-slow pointer-events-none" />
        )}
        
        {/* Profile Image / Initials */}
        <div className={`h-full w-full rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 border border-slate-700 overflow-hidden shadow-inner
          ${!alive ? 'grayscale' : ''}`}>
          {avatar ? (
            <img src={avatar} alt={username} className="h-full w-full object-cover" />
          ) : (
            <span>{username ? username.slice(0, 2).toUpperCase() : '?' }</span>
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
        <h4 className="text-xs font-bold text-white truncate max-w-full px-1">{username || userId}</h4>
        <span className="text-[9px] font-semibold text-slate-400 block tracking-wider uppercase">
          {RANK_BADGES[currentRank] || currentRank}
        </span>
        <span className="text-[9px] font-mono text-slate-500 block">
          {currentElo} ELO
        </span>
      </div>

      {/* Cards remaining indicator (for opponents) */}
      {alive && handCount !== undefined && (
        <div className="mt-2 bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="text-[10px] text-slate-400">Cards:</span>
          <span className="text-[10px] font-bold font-mono text-white">{handCount}</span>
        </div>
      )}

      {/* Dead Tag */}
      {!alive && (
        <span className="mt-2 px-2 py-0.5 bg-red-950 border border-red-900 rounded text-[9px] font-bold text-red-500 uppercase tracking-widest">
          Đã Loại
        </span>
      )}

      {/* Turn indicator text */}
      {isCurrentTurn && alive && (
        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-slate-950 font-bold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
          Lượt Đi
        </span>
      )}

      {/* Select target indicator */}
      {isTargetable && alive && !isSelectedTarget && (
        <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-slate-950 font-bold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow animate-bounce">
          Chọn Mục Tiêu
        </span>
      )}
    </div>
  );
}
