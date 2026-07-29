import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Card from './Card.jsx';
import { OverlayPortal } from './ui/OverlayPortal.jsx';
import { getDrawRevealMotion } from '../pages/Game/gameMotion.js';

export default function DrawReveal({ type, skinIndex = 0, onClose }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const onCloseRef = useRef(onClose);
  const revealMotion = getDrawRevealMotion(reduceMotion);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), revealMotion.holdMs);

    return () => window.clearTimeout(timer);
  }, [revealMotion.holdMs]);

  return (
    <OverlayPortal>
      <AnimatePresence onExitComplete={() => onCloseRef.current?.()}>
        {visible && (
          <motion.div
            className="game-modal-layer fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs select-none pointer-events-none"
            initial={revealMotion.backdrop.initial}
            animate={revealMotion.backdrop.animate}
            exit={revealMotion.backdrop.exit}
            transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={revealMotion.card.initial}
              animate={revealMotion.card.animate}
              exit={revealMotion.card.exit}
              transition={revealMotion.card.transition}
            >
              <motion.span
                className="bg-[#1a1c1c] text-[#facc15] font-headline font-black text-xs px-4.5 py-1.5 rounded-xl border-3 border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-[-3deg] uppercase tracking-wider text-center"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.16 }}
              >
                BẠN VỪA RÚT ĐƯỢC!
              </motion.span>

              <motion.div
                className="filter drop-shadow-[0_0_24px_rgba(251,191,36,0.85)]"
                animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
                transition={{ duration: 0.8, repeat: 1, ease: 'easeInOut' }}
              >
                <Card type={type} skinIndex={skinIndex} disabled={false} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  );
}
