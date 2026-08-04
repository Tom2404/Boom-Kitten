import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function EliminatedPlayerOverlay({ onContinue, onLeave, t }) {
  const reduceMotion = useReducedMotion();
  const continueRef = React.useRef(null);

  React.useEffect(() => {
    continueRef.current?.focus();
  }, []);

  return (
    <motion.section
      className="game-result game-result--loss relative flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden bg-[#171923] px-4 py-8 text-[#f8edcf] select-none"
      initial={{ opacity: 0 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: [0, -5, 4, 0] }}
      transition={{ duration: reduceMotion ? 0.01 : 0.35 }}
      aria-labelledby="eliminated-player-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(139,92,246,0.24),transparent_42%)]" aria-hidden="true" />
      <motion.div
        className="relative z-10 flex w-full max-w-lg flex-col items-center gap-5 border-4 border-slate-950 bg-[#202335] p-6 text-center shadow-[8px_8px_0_#05060a] sm:p-8"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.35 }}
        role="dialog"
        aria-modal="true"
        aria-describedby="eliminated-player-description"
      >
        <span className="border-2 border-slate-950 bg-violet-500 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-950 shadow-[3px_3px_0_#05060a]">
          {t('status_exploded')}
        </span>
        <h1 id="eliminated-player-title" className="font-headline text-4xl font-black uppercase tracking-tight text-violet-300 sm:text-5xl">
          {t('eliminated_title')}
        </h1>
        <p id="eliminated-player-description" className="max-w-md text-sm font-bold leading-relaxed text-slate-300">
          {t('eliminated_description')}
        </p>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <button
            ref={continueRef}
            type="button"
            onClick={onContinue}
            className="rounded-xl border-3 border-slate-950 bg-amber-400 px-4 py-3 font-headline text-xs font-black uppercase text-slate-950 shadow-[4px_4px_0_#05060a] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-sky-400 active:translate-y-1 active:shadow-none"
          >
            {t('eliminated_continue')}
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-xl border-3 border-slate-950 bg-rose-600 px-4 py-3 font-headline text-xs font-black uppercase text-white shadow-[4px_4px_0_#05060a] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-sky-400 active:translate-y-1 active:shadow-none"
          >
            {t('eliminated_leave')}
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}
