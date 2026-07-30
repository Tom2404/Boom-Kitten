import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  GAME_RESULT_DURATION_MS,
  getEndgameSequence,
  getGameMotionTransition,
  getGameResultRemainingSeconds,
} from '../gameMotion.js';

const PARTICLE_COLORS = ['#f97316', '#facc15', '#ef4444', '#10b981', '#3b82f6'];

export default function GameEndedOverlay({
  CoinIcon,
  PRESET_AVATARS,
  gameEnded,
  myUser,
  setGameEnded,
  t,
}) {
  const reduceMotion = useReducedMotion();
  const skipRef = React.useRef(null);
  const [clock, setClock] = React.useState(() => getClock(gameEnded?.dismissAt));

  const dismiss = React.useCallback(() => {
    setGameEnded((current) => current ? { ...current, dismissed: true } : current);
  }, [setGameEnded]);

  React.useEffect(() => {
    skipRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const update = () => {
      const nextClock = getClock(gameEnded?.dismissAt);
      setClock(nextClock);
      if (nextClock.seconds === 0) dismiss();
    };
    const interval = window.setInterval(update, 250);
    const timeout = window.setTimeout(
      dismiss,
      Math.max(0, (gameEnded?.dismissAt || Date.now()) - Date.now()),
    );
    update();
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [dismiss, gameEnded?.dismissAt]);

  if (!gameEnded) return null;

  const snapshot = gameEnded.snapshot || {};
  const rankings = Array.isArray(gameEnded.rankings) ? gameEnded.rankings : [];
  const isWin = gameEnded.winnerId === myUser?.id;
  const sequence = getEndgameSequence(isWin, reduceMotion);
  const finalRankIndex = rankings.findIndex((row) => row.userId === myUser?.id);
  const kittensDefused = snapshot.discardPile?.filter(
    (card) => card.type === 'defuse' || card.type === 'zombie_kitten',
  ).length || 0;
  const playersExploded = snapshot.players?.filter((player) => !player.alive).length || 0;
  const wagerPayout = gameEnded.wager?.payouts?.find(
    (row) => row.userId === myUser?.id,
  )?.payoutCoins || 0;
  const winnerPlayer = snapshot.players?.find(
    (player) => player.userId === gameEnded.winnerId,
  );
  const winnerName = winnerPlayer?.username || gameEnded.winnerId || 'Chiến Mèo';
  const winnerAvatar = winnerPlayer?.avatar || '';
  const winnerFrameUrl = winnerPlayer?.avatarFrame?.assetUrl || '';
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.section
      className={`game-result relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto select-none ${
        isWin
          ? 'game-result--win bg-[#fbf4dc] text-slate-950'
          : 'game-result--loss bg-[#171923] text-[#f8edcf]'
      }`}
      initial={{ opacity: 0 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: isWin ? 0 : [0, -7, 6, -3, 0] }}
      transition={{ duration: reduceMotion ? 0.01 : 0.45 }}
      aria-labelledby="game-result-title"
    >
      <ResultParticles isWin={isWin} reduceMotion={reduceMotion} />
      <div
        className={`pointer-events-none absolute inset-0 ${
          isWin
            ? 'bg-[radial-gradient(circle_at_50%_32%,rgba(250,204,21,0.34),transparent_38%)]'
            : 'bg-[radial-gradient(circle_at_50%_28%,rgba(139,92,246,0.22),transparent_42%)]'
        }`}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center gap-5 px-4 py-6 sm:px-6 md:gap-6 md:py-8"
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
          className={`game-result__title arena-title-brutal mt-1 text-center text-5xl font-black uppercase tracking-tight sm:text-6xl md:text-8xl ${
            isWin ? '' : 'text-violet-400'
          }`}
          initial={reduceMotion ? false : {
            opacity: 0,
            y: isWin ? -70 : -110,
            rotate: isWin ? 7 : -8,
            scale: isWin ? 1.6 : 0.82,
          }}
          animate={sequence.title}
          transition={getGameMotionTransition(reduceMotion)}
        >
          {t(isWin ? 'victory' : 'defeat')}
        </motion.h1>

        <motion.section
          className="relative flex h-52 w-52 items-center justify-center md:h-56 md:w-56"
          variants={itemVariants}
          aria-label={winnerName}
        >
          <motion.div
            className={`absolute inset-2 rounded-full border-4 border-slate-950 shadow-[4px_4px_0_#1a1c1c] ${
              isWin ? 'bg-orange-500' : 'bg-violet-600'
            }`}
            animate={reduceMotion ? undefined : { scale: [0.92, 1.08, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 1.1 }}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-40 w-40 -rotate-2 flex-col items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-950 bg-white text-slate-950 shadow-[8px_8px_0_#1a1c1c]">
            <span className="absolute right-0 top-0 z-20 rotate-[8deg] border-b-4 border-l-4 border-slate-950 bg-red-600 px-3 py-1.5 font-headline text-[9px] font-black uppercase tracking-wider text-white">
              MVP
            </span>
            <div className="relative h-20 w-20">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-on-surface bg-amber-50 font-headline text-4xl font-black">
                {winnerAvatar && PRESET_AVATARS[winnerAvatar]
                  ? <span>{PRESET_AVATARS[winnerAvatar]}</span>
                  : winnerAvatar
                    ? <img src={winnerAvatar} alt={winnerName} className="h-full w-full object-cover" />
                    : <span>{winnerName.slice(0, 2).toUpperCase()}</span>}
              </div>
              {winnerFrameUrl && (
                <img
                  src={winnerFrameUrl}
                  alt=""
                  className="pointer-events-none absolute inset-[-10px] z-10 h-[calc(100%+20px)] w-[calc(100%+20px)] object-contain"
                  onError={(event) => event.currentTarget.remove()}
                />
              )}
            </div>
            <strong className="mt-2 max-w-32 truncate px-2 text-center font-headline text-xs uppercase">
              {winnerName}
            </strong>
          </div>
        </motion.section>

        <motion.div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2" variants={itemVariants}>
          <ResultCard title={t('match_summary')}>
            <ResultRow label={t('kittens_defused')} value={kittensDefused} />
            <ResultRow label={t('players_exploded')} value={playersExploded} />
            <ResultRow label={t('final_rank')} value={finalRankIndex >= 0 ? `#${finalRankIndex + 1}` : '-'} dark />
          </ResultCard>
          <ResultCard title={t('loot_earned')}>
            <motion.div
              className="game-result__loot flex min-h-24 flex-col items-center justify-center border-3 border-slate-950 bg-rose-100 p-3 text-center shadow-[3px_3px_0_#1a1c1c]"
              animate={reduceMotion || !isWin ? undefined : { y: [5, -5, 0], scale: [0.96, 1.03, 1] }}
              transition={{ duration: 1.1 }}
            >
              <CoinIcon className="mb-1 h-7 w-7" />
              <strong className="font-headline text-xs uppercase text-red-700">
                {gameEnded.wager ? `+${wagerPayout}` : t('result_no_wager')}
              </strong>
              <span className="mt-1 text-[10px] font-bold uppercase text-on-surface-variant">
                {gameEnded.wager
                  ? t('result_payout_locked', { stake: gameEnded.wager.stake })
                  : t('result_no_mint')}
              </span>
            </motion.div>
          </ResultCard>
        </motion.div>

        <motion.div className="w-full max-w-md" variants={itemVariants}>
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide" aria-live="polite" aria-atomic="true">
            {t('result_auto_return', { seconds: clock.seconds })}
          </p>
          <div
            className="game-result__segments mb-4"
            role="progressbar"
            aria-label={t('result_countdown_label')}
            aria-valuemin="0"
            aria-valuemax="10"
            aria-valuenow={clock.seconds}
          >
            {Array.from({ length: 10 }, (_, index) => (
              <span
                key={index}
                className={index < Math.ceil(clock.progress / 10) ? 'is-active' : ''}
                aria-hidden="true"
              />
            ))}
          </div>
          <motion.button
            ref={skipRef}
            type="button"
            onClick={dismiss}
            className="w-full rounded-xl border-3 border-slate-950 bg-white py-3.5 font-headline text-sm font-black uppercase text-slate-950 shadow-[4px_4px_0_#1a1c1c] focus:outline-none focus:ring-4 focus:ring-sky-400"
            whileHover={reduceMotion ? undefined : { y: -3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97, x: 2, y: 2 }}
          >
            {t('result_skip')}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

function getClock(deadline, now = Date.now()) {
  return {
    seconds: getGameResultRemainingSeconds(deadline, now),
    progress: Number.isFinite(deadline)
      ? Math.max(0, Math.min(100, ((deadline - now) / GAME_RESULT_DURATION_MS) * 100))
      : 0,
  };
}

function ResultParticles({ isWin, reduceMotion }) {
  if (reduceMotion) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <motion.span
          key={index}
          className={`absolute top-[-24px] block border border-slate-950 ${isWin ? 'h-3 w-2' : 'h-2 w-2 bg-slate-500'}`}
          style={{
            left: `${4 + ((index * 37) % 92)}%`,
            backgroundColor: isWin ? PARTICLE_COLORS[index % PARTICLE_COLORS.length] : undefined,
          }}
          initial={{ y: -30, rotate: 0, opacity: isWin ? 1 : 0.6 }}
          animate={{ y: '110vh', rotate: isWin ? 540 + index * 23 : 160, opacity: [0.8, 0.7, 0] }}
          transition={{
            duration: (isWin ? 2.1 : 3.4) + (index % 5) * 0.2,
            delay: (index % 8) * 0.08,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

function ResultCard({ title, children }) {
  return (
    <section className="game-result__scoreboard border-4 border-slate-950 bg-white p-5 text-slate-950 shadow-[6px_6px_0_#1a1c1c]">
      <h2 className="mb-3 border-b-2 border-slate-950 pb-2 font-headline text-base font-black uppercase">{title}</h2>
      <div className="flex flex-col font-headline text-xs md:text-sm">{children}</div>
    </section>
  );
}

function ResultRow({ label, value, dark = false }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-slate-950/15 py-2 last:border-0">
      <span className="font-bold text-on-surface-variant">{label}</span>
      <strong className={dark ? 'text-slate-950' : 'text-rose-600'}>{value}</strong>
    </div>
  );
}
