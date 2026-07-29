import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGameContext } from '../GameContext.jsx';
import { getEndgameSequence, getGameMotionTransition } from '../gameMotion.js';

const CONFETTI_COLORS = ['#f97316', '#facc15', '#ef4444', '#10b981', '#3b82f6'];

export default function GameEndedOverlay(props) {
  const {
    CoinIcon,
    PRESET_AVATARS,
    gameEnded,
    gameState,
    getPlayerDisplayName,
    leaveRoom,
    myUser,
    playAgain,
    setGameEnded,
  } = { ...useGameContext(), ...props };
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {gameEnded && (() => {
        const isWin = gameEnded.winnerId === myUser?.id;
        const sequence = getEndgameSequence(isWin, reduceMotion);
        const finalRank = gameEnded.rankings.findIndex((row) => row.userId === myUser?.id) + 1;
        const kittensDefused = gameState?.discardPile?.filter(
          (card) => card.type === 'defuse' || card.type === 'zombie_kitten',
        ).length || 0;
        const playersExploded = gameState?.players?.filter((player) => !player.alive).length || 0;
        const wagerPayout = gameEnded.wager?.payouts?.find(
          (row) => row.userId === myUser?.id,
        )?.payoutCoins || 0;
        const winnerPlayer = gameState?.players?.find(
          (player) => player.userId === gameEnded.winnerId,
        );
        const winnerName = winnerPlayer?.username
          || getPlayerDisplayName(gameEnded.winnerId)
          || 'Chiến Mèo';
        const winnerAvatar = winnerPlayer?.avatar || '';
        const itemVariants = {
          hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
          visible: { opacity: 1, y: 0 },
        };

        return (
          <motion.div
            key="game-ended"
            className={`fixed inset-0 z-50 overflow-y-auto flex flex-col items-center justify-between p-6 md:p-8 select-none ${
              isWin ? 'bg-[#faf9f6]' : 'bg-slate-200'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.28 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-result-title"
          >
            {isWin && !reduceMotion && (
              <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden" aria-hidden="true">
                {Array.from({ length: 24 }, (_, index) => (
                  <motion.span
                    key={index}
                    className="absolute top-[-24px] block h-3 w-2 border border-slate-950"
                    style={{
                      left: `${4 + ((index * 37) % 92)}%`,
                      backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                    }}
                    initial={{ y: -30, rotate: 0, opacity: 1 }}
                    animate={{ y: '110vh', rotate: 540 + index * 23, opacity: [1, 1, 0.6] }}
                    transition={{
                      duration: 2.1 + (index % 5) * 0.2,
                      delay: (index % 8) * 0.08,
                      ease: 'linear',
                      repeat: 1,
                    }}
                  />
                ))}
              </div>
            )}

            <motion.div
              className="w-full max-w-4xl mx-auto flex flex-col items-center flex-grow justify-center py-4 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    delayChildren: sequence.contentDelay,
                    staggerChildren: sequence.itemDelay,
                  },
                },
              }}
            >
              <motion.h1
                id="game-result-title"
                className="arena-title-brutal text-6xl md:text-8xl font-black uppercase text-center mt-2 tracking-tight"
                style={isWin ? undefined : { color: '#8b5cf6', textShadow: '4px 4px 0px #1a1c1c' }}
                initial={reduceMotion ? false : {
                  opacity: 0,
                  y: isWin ? -70 : -110,
                  rotate: isWin ? 7 : -8,
                  scale: isWin ? 1.6 : 0.82,
                }}
                animate={sequence.title}
                transition={getGameMotionTransition(reduceMotion)}
              >
                {isWin ? 'VICTORY!' : 'DEFEAT!'}
              </motion.h1>

              <motion.div
                className="relative mt-4 mb-4 flex justify-center items-center w-64 h-64"
                variants={itemVariants}
                transition={getGameMotionTransition(reduceMotion)}
              >
                <motion.div
                  className={`absolute inset-0 m-auto w-56 h-56 rounded-full border-4 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] z-0 ${
                    isWin ? 'bg-orange-500' : 'bg-purple-500'
                  }`}
                  animate={reduceMotion ? undefined : {
                    scale: isWin ? [1, 1.06, 1] : 1,
                    rotate: isWin ? [0, 3, -3, 0] : 0,
                  }}
                  transition={{ duration: 1.4, repeat: isWin ? Infinity : 0, repeatDelay: 0.8 }}
                />
                <motion.div
                  className="relative w-44 h-44 bg-white border-4 border-slate-950 rounded-2xl shadow-[8px_8px_0px_0px_#1a1c1c] z-10 overflow-hidden flex flex-col items-center justify-center"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.55, rotate: 10 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
                  transition={getGameMotionTransition(reduceMotion)}
                >
                  <div className="absolute top-0 right-0 bg-red-600 text-white font-headline font-black border-l-4 border-b-4 border-slate-950 px-3 py-1.5 rotate-[8deg] text-[9px] uppercase tracking-wider z-20 shadow">
                    MVP
                  </div>
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
                </motion.div>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl items-stretch"
                variants={itemVariants}
              >
                <div className="bg-white border-4 border-slate-950 shadow-[6px_6px_0px_0px_#1a1c1c] rounded-3xl p-6">
                  <h3 className="font-headline font-black text-base md:text-lg text-slate-950 uppercase mb-4 pb-2 border-b-3 border-on-surface">
                    MATCH SUMMARY
                  </h3>
                  <div className="flex flex-col gap-3 font-headline text-xs md:text-sm">
                    <ResultRow label="KITTENS DEFUSED" value={kittensDefused} />
                    <ResultRow label="PLAYERS EXPLODED" value={playersExploded} />
                    <ResultRow label="FINAL RANK" value={`#${finalRank || '-'}`} dark />
                  </div>
                </div>

                <div className="bg-white border-4 border-slate-950 shadow-[6px_6px_0px_0px_#1a1c1c] rounded-3xl p-6">
                  <h3 className="font-headline font-black text-base md:text-lg text-slate-950 uppercase mb-4 pb-2 border-b-3 border-on-surface">
                    LOOT EARNED
                  </h3>
                  <motion.div
                    className="bg-[#fee2e2] border-3 border-slate-950 shadow-[3px_3px_0px_0px_#1a1c1c] p-3 rounded-2xl flex flex-col items-center justify-center text-center"
                    animate={reduceMotion || !isWin ? undefined : { y: [0, -5, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.7 }}
                  >
                    <CoinIcon className="w-7 h-7 mb-1" />
                    <span className="font-headline font-black text-[11px] text-red-700 uppercase">
                      {gameEnded.wager ? `+${wagerPayout}` : 'KHÔNG CƯỢC'}
                    </span>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">
                      {gameEnded.wager
                        ? `Payout từ ${gameEnded.wager.stake} Coin đã khóa`
                        : 'Trận thường không mint Coin'}
                    </span>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4"
                variants={itemVariants}
              >
                <motion.button
                  onClick={playAgain}
                  className="flex-1 bg-orange-500 text-white font-headline font-black text-sm uppercase py-3.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] flex items-center justify-center gap-2"
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96, x: 2, y: 2 }}
                >
                  PLAY AGAIN
                </motion.button>
                <motion.button
                  onClick={() => {
                    setGameEnded(null);
                    leaveRoom();
                  }}
                  className="flex-1 bg-white text-slate-950 font-headline font-black text-sm uppercase py-3.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] flex items-center justify-center gap-2"
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96, x: 2, y: 2 }}
                >
                  RETURN TO LOBBY
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}

function ResultRow({ label, value, dark = false }) {
  return (
    <>
      <div className="flex justify-between items-center py-1">
        <span className="text-on-surface-variant font-bold">{label}</span>
        <span className={`${dark ? 'text-slate-950' : 'text-rose-600'} font-black text-sm`}>{value}</span>
      </div>
      <div className="h-px bg-slate-950/10 border-dashed border-t" />
    </>
  );
}
