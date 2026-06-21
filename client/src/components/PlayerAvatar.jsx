import React from 'react';
import { formatCardName } from '../utils/cardHelpers.js';
import { getCardImageUrl } from '../utils/cardSkins.js';
import { RankBadge } from './Icons.jsx';

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
  edition,
  isWaitingBK,
}) {
  const { userId, username, alive, handCount, avatar, activeAvatarFrame, eloPoints, rank, markedCards, pendingTakeFrom } = player;
  const visibleMarkedCards = markedCards?.slice(0, 3) ?? [];
  const hiddenMarkedCount = Math.max((markedCards?.length ?? 0) - visibleMarkedCards.length, 0);

  const handleSelect = () => {
    if (isTargetable && onSelectTarget) {
      onSelectTarget(userId);
    }
  };

  const currentRank = rank || publicProfile?.rank || 'Bronze IV';
  const currentElo = eloPoints || publicProfile?.eloPoints || 1000;

  return (
    <div className="flex flex-row items-start gap-2 relative">
      {/* Main Player Avatar Box */}
      <div
        id={`player-avatar-${userId}`}
        onClick={handleSelect}
        className={`relative p-3 rounded-2xl flex flex-col items-center justify-between transition-all duration-200 select-none w-36
          ${alive 
            ? (isCurrentTurn 
                ? 'bg-yellow-300 text-slate-950 border-4 scale-105 animate-brutal-glow' 
                : 'bg-surface text-on-surface border-3 border-on-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]') 
            : (edition === 'zombie'
                ? 'bg-[#1a2e22] text-[#d1fae5] border-3 border-[#047857] shadow-[2px_2px_0px_0px_#0f0f0f] opacity-80'
                : 'bg-surface-dim opacity-50 text-on-surface border-3 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]')}
          ${isTargetable && alive 
            ? 'cursor-pointer border-dashed border-indigo-400 hover:-translate-y-1 hover:border-yellow-400 shadow-[4px_4px_0px_0px_rgba(99,102,241,0.5)]' 
            : ''}
          ${isSelectedTarget && alive 
            ? 'ring-4 ring-yellow-400 border-yellow-400 -translate-y-1' 
            : ''}`}
      >
        {/* Barking Kitten sound wave sticker */}
        {alive && isWaitingBK && (
          <div className="absolute -top-5 -right-3 rotate-[12deg] z-30 bg-amber-400 text-slate-950 border-3 border-on-surface font-headline font-black text-[9px] leading-none px-2 py-1.5 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] uppercase tracking-wider text-center select-none animate-bounce">
            <div className="text-[6.5px] font-bold opacity-80 leading-none">BARKING</div>
            <div className="flex items-center justify-center gap-0.5 my-1">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="4" width="2" height="4" fill="#1a1c1c" />
                <rect x="3" y="2" width="2" height="8" fill="#1a1c1c" />
                <rect x="6" y="0" width="2" height="12" fill="#1a1c1c" />
                <rect x="9" y="2" width="2" height="8" fill="#1a1c1c" />
                <rect x="12" y="4" width="2" height="4" fill="#1a1c1c" />
                <rect x="15" y="5" width="2" height="2" fill="#1a1c1c" />
              </svg>
            </div>
            <div className="text-[8.5px] leading-none font-black">WAITING</div>
          </div>
        )}
        {/* Neobrutalist Bouncing SVG Arrow instead of emoji */}
        {isCurrentTurn && alive && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-45 animate-bounce pointer-events-none">
            <svg
              width="24"
              height="28"
              viewBox="0 0 24 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[2px_2px_0px_rgba(26,28,28,1)]"
            >
              <path
                d="M12 26L2 15H8V2H16V15H22L12 26Z"
                fill="#facc15"
                stroke="#1a1c1c"
                strokeWidth="2.5"
                strokeLinejoin="miter"
              />
            </svg>
          </div>
        )}
        {/* Player Frame & Image Container */}
        <div className="relative h-16 w-16 mb-2 flex items-center justify-center">
          {alive ? (
            <>
              {/* Avatar Frame (if any) */}
              {activeAvatarFrame && (
                <div className="absolute inset-[-6px] rounded-full border-4 border-yellow-400 animate-spin-slow pointer-events-none z-10" />
              )}
              
              {/* Profile Image / Initials */}
              <div className="h-full w-full rounded-full flex items-center justify-center text-xl font-headline font-black bg-primary-fixed border-2 border-on-surface overflow-hidden shadow-inner">
                {avatar && PRESET_AVATARS[avatar] ? (
                  <span className="text-3xl">{PRESET_AVATARS[avatar]}</span>
                ) : avatar ? (
                  <img src={avatar} alt={username} className="h-full w-full object-cover" />
                ) : (
                  <span>{username ? username.slice(0, 2).toUpperCase() : '?'}</span>
                )}
              </div>
            </>
          ) : (
            /* Custom Tombstone SVG for dead players (Zombies) - Zero Emojis */
            <svg viewBox="0 0 64 64" className="w-16 h-16 drop-shadow-[2px_2px_0px_#0f0f0f]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 56V22C12 13 20 6 32 6C44 6 52 13 52 22V56H12Z" fill="#9ca3af" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
              <path d="M24 14L28 20L26 26" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="32" y="38" textAnchor="middle" fill="#1a1a1a" fontSize="12" fontWeight="900" fontFamily="monospace">R.I.P</text>
              <path d="M6 56H58" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
    
        {/* Name and Rank Details */}
        <div className="w-full text-center">
          <h4 className={`text-xs font-headline font-black truncate max-w-full px-1 
            ${isCurrentTurn && alive 
              ? 'text-slate-950' 
              : (edition === 'zombie' && !alive ? 'text-[#a7f3d0]' : 'text-on-surface')}`}>
            {username || userId}
          </h4>
          <div className="flex justify-center my-0.5">
            <RankBadge rank={currentRank} className="w-4 h-4" showText={true} />
          </div>
          <span className={`text-[9px] font-mono font-bold block mt-0.5 ${isCurrentTurn && alive ? 'text-slate-700' : 'text-on-surface-variant'}`}>
            {currentElo} ELO
          </span>
          {/* Mockup status dots below ELO inside the card */}
          <div className="flex gap-1.5 justify-center mt-1.5">
            <span className={`h-2.5 w-2.5 rounded-full border border-on-surface ${alive ? 'bg-secondary' : 'bg-slate-300'}`} />
            <span className={`h-2.5 w-2.5 rounded-full border border-on-surface ${alive ? 'bg-secondary' : 'bg-slate-300'}`} />
          </div>
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
          <span className="mt-2 px-2 py-0.5 bg-emerald-800 text-white border-2 border-slate-900 rounded-none text-[9px] font-headline font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#0f0f0f]">
            {edition === 'zombie' ? 'ZOMBIE' : 'ĐÃ LOẠI'}
          </span>
        )}
  
        {/* Turn indicator text (slanted comic sticker matching mockup) */}
        {isCurrentTurn && alive && (
          <div className="absolute -top-7 -left-2 rotate-[-8deg] z-30 bg-[#b7131a] text-white border-3 border-on-surface font-headline font-black text-[9px] leading-none px-3.5 py-1.5 shadow-[2.5px_2.5px_0px_0px_rgba(26,28,28,1)] uppercase tracking-wider text-center select-none animate-comic-float">
            <div className="text-[6.5px] font-bold opacity-80 leading-none">CURRENT</div>
            <div className="text-[9.5px] leading-none mt-0.5 font-black">TURN</div>
          </div>
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
            Đang nhắm
          </div>
        )}
      </div>

      {/* Marked (Revealed) Cards Displayed Side-by-Side */}
      {alive && visibleMarkedCards.length > 0 && (
        <div className="flex flex-col gap-1.5 p-2 bg-rose-50 border-3 border-rose-500 rounded-2xl shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] animate-fade-in z-20 max-w-[80px] self-start mt-2">
          <div className="text-center flex flex-col items-center">
            <span className="text-[8px] font-headline font-black uppercase tracking-wider text-rose-600 block leading-tight">
              BÀI LỘ
            </span>
            {hiddenMarkedCount > 0 && (
              <span className="mt-0.5 rounded-full bg-rose-200 px-1 py-0.2 text-[8px] font-headline font-black text-rose-700 leading-none">
                +{hiddenMarkedCount}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 items-center justify-center mt-1">
            {visibleMarkedCards.map((c) => {
              const imgUrl = getCardImageUrl(c.type, c.skinIndex ?? 0);
              return (
                <div
                  key={c.id}
                  className="w-12 h-16 border-2 border-rose-400 rounded-lg overflow-hidden bg-white shadow-[2px_2px_0px_0px_#f43f5e] hover:scale-105 transition-all cursor-help relative"
                  title={formatCardName(c.type)}
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt={c.type} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] flex items-center justify-center h-full w-full font-headline font-black uppercase">🃏</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export { PRESET_AVATARS };
