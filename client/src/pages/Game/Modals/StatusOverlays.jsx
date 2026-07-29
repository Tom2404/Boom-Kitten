import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGameContext } from '../GameContext.jsx';
import { getGameMotionTransition } from '../gameMotion.js';

export default function StatusOverlays(props) {
  const reduceMotion = useReducedMotion();
  const spring = getGameMotionTransition(reduceMotion);
  const {
    CustomDialog,
    dialogState,
    drewKittenAlert,
    isImplodingActive,
    isRedFlashActive,
    nopeAlert,
    nopeStamp,
    setDialogState,
    zombieFog,
  } = { ...useGameContext(), ...props };

  return (
    <>
<AnimatePresence>
{nopeStamp && nopeStamp.active && (
  <motion.div
    key="nope-stamp"
    className="fixed inset-0 flex items-center justify-center pointer-events-none z-[120]"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="nope-stamp"
      initial={reduceMotion ? false : { scale: 2.2, rotate: -18 }}
      animate={{ scale: 1, rotate: -8 }}
      transition={spring}
    >
      NOPE
    </motion.div>
  </motion.div>
)}

{isRedFlashActive && (
  <motion.div
    key="danger-flash"
    className="fixed inset-0 pointer-events-none z-[130] border-[16px] border-rose-600 rounded-3xl"
    initial={{ opacity: 0 }}
    animate={reduceMotion ? { opacity: 0.55 } : { opacity: [0, 0.9, 0.2, 0.8, 0] }}
    exit={{ opacity: 0 }}
    transition={{ duration: reduceMotion ? 0.01 : 0.7, repeat: reduceMotion ? 0 : 1 }}
  />
)}

{zombieFog && (
  <motion.div
    key="zombie-fog"
    className="zombie-fog-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  />
)}

{isImplodingActive && (
  <motion.div
    key="imploding"
    className="fixed inset-0 pointer-events-none z-[135] flex items-center justify-center bg-slate-950/70 backdrop-blur-md"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="relative flex flex-col items-center justify-center gap-4"
      initial={reduceMotion ? false : { scale: 1.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: reduceMotion ? 1 : 0.3, opacity: 0 }}
      transition={spring}
    >
      <motion.svg
        className="w-56 h-56 text-purple-500 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        animate={reduceMotion ? undefined : { rotate: -360, scale: [1, 0.78, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <path
          d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm0 80c-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35-15.7 35-35 35z"
          fill="currentColor"
          className="opacity-10"
        />
        <path
          d="M50 15C30.7 15 15 30.7 15 50c0 9.7 3.9 18.4 10.2 24.8l7.1-7.1C27.2 62.7 25 56.6 25 50c0-13.8 11.2-25 25-25v-10z"
          fill="currentColor"
        />
        <path
          d="M50 25C36.2 25 25 36.2 25 50c0 6.9 2.8 13.1 7.3 17.7l7.1-7.1C37.3 58.7 35 54.6 35 50c0-8.3 6.7-15 15-15v-10z"
          fill="currentColor"
          className="opacity-70"
        />
      </motion.svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-white font-headline font-black text-5xl italic uppercase tracking-widest text-center select-none [-webkit-text-stroke:2px_#1a1c1c] drop-shadow-[4px_4px_0px_#7c3aed]">
          IMPLODING!
        </span>
        <span className="text-purple-300 font-sans font-bold text-xs uppercase tracking-widest mt-2 animate-pulse">
          Sập nguồn vũ trụ
        </span>
      </div>
    </motion.div>
  </motion.div>
)}

{drewKittenAlert && drewKittenAlert.active && (() => {
  const cleanType = drewKittenAlert.cardType.startsWith('discard_')
    ? drewKittenAlert.cardType.replace('discard_', '')
    : drewKittenAlert.cardType;
  const cardName = cleanType === 'exploding_kitten' ? 'Mèo Nổ' : cleanType === 'imploding_kitten' ? 'Mèo Sập Nguồn' : cleanType === 'devilcat' ? 'Mèo Quỷ' : cleanType;
  return (
    <motion.div
      key="kitten-alert"
      className="fixed top-12 left-1/2 -translate-x-1/2 bg-[#1a1c1c] border-4 border-rose-500 text-white px-5 md:px-8 py-4 rounded-2xl flex items-center gap-4 shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] z-[99999] max-w-[calc(100vw-2rem)]"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -80, scale: 0.85 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, x: [0, -7, 6, -3, 0] }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : -24 }}
      transition={spring}
      role="status"
      aria-live="assertive"
    >
      <div className="p-2 bg-rose-500/10 rounded-xl border-2 border-rose-500">
        <svg className="w-8 h-8 text-rose-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="flex flex-col text-left">
        <span className="font-headline font-black text-rose-500 uppercase text-[10px] tracking-wider">CẢNH BÁO NGUY HIỂM</span>
        <span className="font-sans font-bold text-xs text-slate-100 mt-0.5">
          Người chơi <strong className="text-yellow-400 font-black">{drewKittenAlert.playerName}</strong> đã bốc trúng quân <strong className="text-rose-400 font-black">{cardName}</strong>!
        </span>
      </div>
    </motion.div>
  );
})()}

{nopeAlert && nopeAlert.active && (
  <motion.div
    key="nope-alert"
    className="fixed inset-0 flex items-center justify-center pointer-events-none z-[99998]"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="bg-rose-600 text-white text-7xl font-headline font-black uppercase tracking-wider px-12 py-5 rounded-3xl border-6 border-white shadow-[8px_8px_0px_0px_rgba(26,28,28,1)]"
      initial={reduceMotion ? false : { scale: 2.4, rotate: 12 }}
      animate={{ scale: 1, rotate: -5 }}
      transition={spring}
    >
      NOPE!
    </motion.div>
  </motion.div>
)}
</AnimatePresence>

<CustomDialog
  isOpen={dialogState.isOpen}
  title={dialogState.title}
  message={dialogState.message}
  isConfirm={dialogState.isConfirm}
  confirmText={dialogState.confirmText}
  cancelText={dialogState.cancelText}
  onConfirm={dialogState.onConfirm}
  onCancel={() => setDialogState({ isOpen: false })}
/>
    </>
  );
}
