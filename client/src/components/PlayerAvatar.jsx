import React from 'react';
import { formatCardName } from '../utils/cardHelpers.js';

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
  const { userId, username, alive, handCount, avatar, activeAvatarFrame, eloPoints, rank, markedCards, pendingTakeFrom } = player;
  const visibleMarkedCards = markedCards?.slice(0, 3) ?? [];
  const hiddenMarkedCount = Math.max((markedCards?.length ?? 0) - visibleMarkedCards.length, 0);

  const handleSelect = () => {
    if (isTargetable && onSelectTarget) {
      onSelectTarget(userId);
    }
  };

  const currentRank = rank || publicProfile?.rank || 'Bronze';
  const currentElo = eloPoints || publicProfile?.eloPoints || 1000;

  return (
    <div
      id={`player-avatar-${userId}`}
      onClick={handleSelect}
      className={`relative p-3 rounded-2xl flex flex-col items-center justify-between transition-all duration-200 select-none w-36
        ${alive 
          ? (isCurrentTurn 
              ? 'bg-yellow-300 text-slate-950 border-4 border-slate-950 scale-105 shadow-[6px_6px_0px_0px_rgba(26,28,28,1)]' 
              : 'bg-surface text-on-surface border-3 border-on-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]') 
          : 'bg-surface-dim opacity-50 text-on-surface border-3 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]'}
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
        <h4 className={`text-xs font-headline font-black truncate max-w-full px-1 ${isCurrentTurn && alive ? 'text-slate-950' : 'text-on-surface'}`}>
          {username || userId}
        </h4>
        <span className={`text-[9px] font-headline font-black block tracking-wider uppercase ${isCurrentTurn && alive ? 'text-slate-800' : 'text-primary'}`}>
          {RANK_BADGES[currentRank] || currentRank}
        </span>
        <span className={`text-[9px] font-mono font-bold block ${isCurrentTurn && alive ? 'text-slate-700' : 'text-on-surface-variant'}`}>
          {currentElo} ELO
        </span>
      </div>

      {/* Cards remaining indicator (for opponents) */}
      {alive && handCount !== undefined && (
        <div className={`mt-2 border-2 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(26,28,28,1)]
          ${isCurrentTurn && alive 
            ? 'bg-yellow-400 border-slate-950' 
            : 'bg-surface-container-high border-on-surface'}`}>
          <span className={`text-[9px] font-headline font-bold ${isCurrentTurn && alive ? 'text-slate-800' : 'text-on-surface-variant'}`}>CARDS:</span>
          <span className={`text-[10px] font-headline font-black ${isCurrentTurn && alive ? 'text-slate-950' : 'text-primary'}`}>{handCount}</span>
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
        <span className="absolute -top-4.5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-950 font-headline font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow border-3 border-slate-950 animate-bounce whitespace-nowrap z-30">
          👉 LƯỢT ĐI 🔥
        </span>
      )}

      {/* Select target indicator */}
      {isTargetable && alive && !isSelectedTarget && (
        <span className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-950 font-headline font-black text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow border-2 border-on-surface animate-bounce">
          CHỌN MỤC TIÊU
        </span>
      )}
      {/* Redirection warning */}
      {alive && pendingTakeFrom && (
        <div className="w-full mt-2 flex flex-col gap-1 text-[9px] font-bold border-t border-on-surface/10 pt-2 text-left">
          <span className="text-rose-500 uppercase animate-pulse">
            Bị cướp bài bốc tiếp theo
          </span>
        </div>
      )}

      {alive && isSelectedTarget && (
        <div className="mt-2 rounded-full border-2 border-on-surface bg-yellow-400 px-3 py-1 text-[9px] font-headline font-black uppercase tracking-wider text-slate-950 shadow-[2px_2px_0px_0px_#1a1c1c]">
          🎯 Đang nhắm
        </div>
      )}

      {alive && visibleMarkedCards.length > 0 && (
        <div className="mt-2 w-full rounded-xl border-2 border-rose-500 bg-white px-2 py-1.5 text-left shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[8px] font-headline font-black uppercase tracking-wider text-rose-600">
              👁 Bài bị lộ
            </span>
            {hiddenMarkedCount > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[8px] font-headline font-black text-rose-700">
                +{hiddenMarkedCount}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {visibleMarkedCards.map((c) => (
              <span key={c.id} className="max-w-full truncate rounded-md border border-rose-300 bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold leading-tight text-rose-700">
                {formatCardName(c.type)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export { PRESET_AVATARS };
