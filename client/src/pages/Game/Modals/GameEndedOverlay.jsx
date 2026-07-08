import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function GameEndedOverlay(props) {
  const {
    CoinIcon,
    GemIcon,
    PRESET_AVATARS,
    gameEnded,
    gameState,
    getPlayerDisplayName,
    leaveRoom,
    myPlayerState,
    myUser,
    playAgain,
    setGameEnded,
  } = { ...useGameContext(), ...props };

  return (
    <>
{/* 9. Game Ended Win Overlay */}
{gameEnded && (() => {
  const isWin = gameEnded.winnerId === myUser?.id;
  const finalRank = gameEnded.rankings.findIndex(r => r.userId === myUser?.id) + 1;
  const kittensDefused = gameState?.discardPile?.filter(c => c.type === 'defuse' || c.type === 'zombie_kitten').length || 0;
  const playersExploded = gameState?.players?.filter(p => !p.alive).length || 0;

  const eloChange = gameEnded.eloChanges?.[myUser?.id] || 0;
  const pinkCoinEarned = gameEnded.pinkCoinChanges?.[myUser?.id] || 0;
  const currentElo = myPlayerState?.eloPoints || 1000;
  const prevElo = currentElo - eloChange;

  const streakBonus = isWin && myPlayerState?.stats?.currentStreak >= 3 ? 30 : 0;
  const coinsEarned = isWin ? (50 + streakBonus) : 10;

  const winnerPlayer = gameState?.players?.find(p => p.userId === gameEnded.winnerId);
  const winnerName = winnerPlayer?.username || getPlayerDisplayName(gameEnded.winnerId) || 'Chiến Mèo';
  const winnerAvatar = winnerPlayer?.avatar || '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#faf9f6] flex flex-col items-center justify-between p-6 md:p-8 animate-fade-in select-none ended-overlay-anim">
      {/* Confetti Container */}
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-[999] overflow-hidden" />

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center flex-grow justify-center py-4 gap-6">

        {/* Victory / Defeat slanted title */}
        {isWin ? (
          <h1 className="arena-title-brutal text-6xl md:text-8xl font-black uppercase text-center mt-2 rotate-[-2.5deg] tracking-tight">
            VICTORY!
          </h1>
        ) : (
          <h1
            className="arena-title-brutal text-6xl md:text-8xl font-black uppercase text-center mt-2 rotate-[-2.5deg] tracking-tight"
            style={{ color: '#8b5cf6', textShadow: '4px 4px 0px #1a1c1c' }}
          >
            DEFEAT!
          </h1>
        )}

        {/* MVP Section with circle background */}
        <div className="relative mt-4 mb-4 flex justify-center items-center w-64 h-64">
          {/* Circle */}
          <div className={`absolute inset-0 m-auto w-56 h-56 rounded-full border-4 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] z-0 transition-transform hover:scale-105 duration-200
            ${isWin ? 'bg-orange-500' : 'bg-purple-500'}`}
          />

          {/* MVP Card */}
          <div className="relative w-44 h-44 bg-white border-4 border-slate-950 rounded-2xl shadow-[8px_8px_0px_0px_#1a1c1c] rotate-[-2.5deg] z-10 overflow-hidden flex flex-col items-center justify-center hover:rotate-[1deg] transition-all">
            {/* MVP Slanted Badge */}
            <div className="absolute top-0 right-0 bg-red-600 text-white font-headline font-black border-l-4 border-b-4 border-slate-950 px-3 py-1.5 rotate-[8deg] text-[9px] uppercase tracking-wider z-20 shadow">
              MVP
            </div>

            {/* Winner Avatar */}
            <div className="h-24 w-24 rounded-full flex items-center justify-center text-5xl font-headline font-black bg-amber-50 border-2 border-on-surface overflow-hidden shadow-inner">
              {winnerAvatar && PRESET_AVATARS[winnerAvatar] ? (
                <span>{PRESET_AVATARS[winnerAvatar]}</span>
              ) : winnerAvatar ? (
                <img src={winnerAvatar} alt={winnerName} className="h-full w-full object-cover" />
              ) : (
                <span>{winnerName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <span className="font-headline font-black text-xs uppercase text-on-surface tracking-tight mt-2.5 truncate max-w-[150px] px-2 text-center block">
              {winnerName}
            </span>
          </div>
        </div>

        {/* Match Summary & Loot Earned columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl items-stretch">

          {/* Left Card: Match Summary */}
          <div className="bg-white border-4 border-slate-950 shadow-[6px_6px_0px_0px_#1a1c1c] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-headline font-black text-base md:text-lg text-slate-950 uppercase mb-4 flex items-center gap-1.5 pb-2 border-b-3 border-on-surface">
                MATCH SUMMARY
              </h3>
              <div className="flex flex-col gap-3 font-headline text-xs md:text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant font-bold">KITTENS DEFUSED</span>
                  <span className="text-rose-600 font-black text-sm">{kittensDefused}</span>
                </div>
                <div className="h-px bg-slate-950/10 border-dashed border-t" />
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant font-bold">PLAYERS EXPLODED</span>
                  <span className="text-rose-600 font-black text-sm">{playersExploded}</span>
                </div>
                <div className="h-px bg-slate-950/10 border-dashed border-t" />
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant font-bold">FINAL RANK</span>
                  <span className="text-slate-950 font-black text-sm">#{finalRank}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Loot Earned */}
          <div className="bg-white border-4 border-slate-950 shadow-[6px_6px_0px_0px_#1a1c1c] rounded-3xl p-6 flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-headline font-black text-base md:text-lg text-slate-950 uppercase mb-4 flex items-center gap-1.5 pb-2 border-b-3 border-on-surface">
                LOOT EARNED
              </h3>
              <div className={`grid gap-4 w-full ${pinkCoinEarned > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {/* Coins Card */}
                <div className="bg-[#fee2e2] border-3 border-slate-950 shadow-[3px_3px_0px_0px_#1a1c1c] p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                  <CoinIcon className="w-7 h-7 mb-1" />
                  <span className="font-headline font-black text-[11px] text-red-700 uppercase">+{coinsEarned}</span>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Gold Coin</span>
                </div>

                {/* ELO Card */}
                <div className="bg-cyan-50 border-3 border-slate-950 shadow-[3px_3px_0px_0px_#1a1c1c] p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className={`font-headline font-black text-[11px] uppercase mt-2 ${eloChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {eloChange >= 0 ? `+${eloChange}` : eloChange}
                  </span>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Elo Change</span>
                </div>

                {/* Pink Coin Card */}
                {pinkCoinEarned > 0 && (
                  <div className="bg-pink-50 border-3 border-slate-950 shadow-[3px_3px_0px_0px_#1a1c1c] p-3 rounded-2xl flex flex-col items-center justify-center text-center animate-bounce">
                    <GemIcon className="w-7 h-7 mb-1" />
                    <span className="font-headline font-black text-[11px] text-pink-600 uppercase">+{pinkCoinEarned}</span>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Pink Coin</span>
                  </div>
                )}
              </div>
            </div>

            {/* Level up / Elo rating banner */}
            <div className="flex flex-col gap-2">
              <div className="bg-slate-950 text-white font-headline font-black text-[10px] md:text-xs text-center py-2.5 px-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(26,28,28,0.2)] tracking-wider uppercase select-none flex items-center justify-center gap-1">
                <span>ELO PROGRESSION:</span>
                <span className="text-yellow-400 font-bold">{prevElo}</span>
                <span>➔</span>
                <span className="text-emerald-400 font-bold">{currentElo}</span>
              </div>
              {pinkCoinEarned > 0 && (
                <div className="bg-pink-500 text-white font-headline font-black text-[9px] md:text-[10px] text-center py-1.5 px-3 rounded-lg border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase tracking-wider animate-pulse flex items-center justify-center gap-1">
                  RANK UP REWARD: +{pinkCoinEarned} PINK COINS!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
          <button
            onClick={playAgain}
            className="flex-1 bg-orange-500 text-white font-headline font-black text-sm uppercase py-3.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1c1c] hover:-translate-y-0.5 transition-all duration-100 flex items-center justify-center gap-2"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => {
              setGameEnded(null);
              leaveRoom();
            }}
            className="flex-1 bg-white text-slate-950 font-headline font-black text-sm uppercase py-3.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1c1c] hover:-translate-y-0.5 transition-all duration-100 flex items-center justify-center gap-2"
          >
            RETURN TO LOBBY
          </button>
        </div>

      </div>
    </div>
  );
})()}
    </>
  );
}
