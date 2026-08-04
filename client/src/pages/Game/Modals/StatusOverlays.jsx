import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGameContext } from '../GameContext.jsx';
import { getGameMotionTransition } from '../gameMotion.js';
import Card from '../../../components/Card.jsx';

export default function StatusOverlays(props) {
  const reduceMotion = useReducedMotion();
  const spring = getGameMotionTransition(reduceMotion);
  const {
    CustomDialog,
    dialogState,
    drewKittenAlert,
    isRedFlashActive,
    setDialogState,
    zombieFog,
  } = { ...useGameContext(), ...props };

  return (
    <>
<AnimatePresence>
{isRedFlashActive && (
  <motion.div
    key="danger-anticipation"
    className="fixed inset-0 pointer-events-none z-[130] border-[8px] border-rose-600/50 bg-slate-950/15 rounded-3xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.55 }}
    exit={{ opacity: 0 }}
    transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
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
      <div className="w-14 shrink-0" aria-hidden="true">
        <Card type={cleanType} compact disabled />
      </div>
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
