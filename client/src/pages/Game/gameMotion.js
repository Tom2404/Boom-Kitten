import { CARD_TIMINGS } from '../../vfx/config/vfxTimings.js';

export const getGameMotionTransition = (reducedMotion = false) => (
  reducedMotion
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 260, damping: 24, mass: 0.8 }
);

export const GAME_RESULT_DURATION_MS = 10_000;

export function createBoundedEventGate(limit = 160) {
  const ids = new Set();

  return {
    accept(id) {
      if (!id) return true;
      if (ids.has(id)) return false;
      ids.add(id);
      while (ids.size > limit) ids.delete(ids.values().next().value);
      return true;
    },
    clear() {
      ids.clear();
    },
    get size() {
      return ids.size;
    },
  };
}

export function findCorrelatedDrawCard(previousCards, nextCards, sourceEventId, expectedEventId) {
  if (!sourceEventId || sourceEventId !== expectedEventId) return null;
  const previousIds = new Set((previousCards || []).map((card) => card.id));
  return (nextCards || []).find((card) => !previousIds.has(card.id)) || null;
}

export function createGameResultState({
  winnerId,
  rankings,
  wager,
  snapshot,
  now = Date.now(),
}) {
  return {
    winnerId,
    rankings: Array.isArray(rankings) ? rankings : [],
    wager: wager ?? null,
    snapshot: snapshot ?? null,
    dismissAt: now + GAME_RESULT_DURATION_MS,
    dismissed: false,
  };
}

export function getGameResultRemainingSeconds(deadline, now = Date.now()) {
  if (!Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function createTimeoutGroup(
  scheduleTimeout = globalThis.setTimeout.bind(globalThis),
  cancelTimeout = globalThis.clearTimeout.bind(globalThis),
) {
  const pending = new Set();

  return {
    schedule(callback, delay) {
      let id;
      id = scheduleTimeout(() => {
        pending.delete(id);
        callback();
      }, delay);
      pending.add(id);
      return id;
    },
    clearAll() {
      pending.forEach((id) => cancelTimeout(id));
      pending.clear();
    },
    get size() {
      return pending.size;
    },
  };
}

export function getDefusePositionProgress(position, deckCount) {
  if (!Number.isFinite(deckCount) || deckCount <= 0) return 0;
  return Math.max(0, Math.min(Number(position) || 0, deckCount)) / deckCount;
}

export function getDrawRevealMotion(reducedMotion = false) {
  const transition = getGameMotionTransition(reducedMotion);

  return {
    // Shares CARD_TIMINGS with the GSAP flight so the two never drift apart.
    // Hold = fly-in + revealHold (the actual reading time) + fly-out.
    holdMs: reducedMotion
      ? 1000
      : Math.round((CARD_TIMINGS.travel + CARD_TIMINGS.revealHold + CARD_TIMINGS.travel) * 1000),
    backdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    card: {
      initial: {
        opacity: 0,
        y: reducedMotion ? 0 : -180,
        rotate: reducedMotion ? 0 : -12,
        scale: reducedMotion ? 0.96 : 0.55,
      },
      animate: { opacity: 1, y: 0, rotate: -2, scale: CARD_TIMINGS.revealScale },
      exit: {
        opacity: 0,
        y: reducedMotion ? 0 : 260,
        rotate: reducedMotion ? 0 : 8,
        scale: reducedMotion ? 0.96 : 0.48,
      },
      transition,
    },
  };
}

export function getEndgameSequence(isWin, reducedMotion = false) {
  if (reducedMotion) {
    return {
      tone: isWin ? 'victory' : 'defeat',
      title: { opacity: 1, y: 0, rotate: 0, scale: 1 },
      contentDelay: 0,
      itemDelay: 0,
    };
  }

  return isWin
    ? {
      tone: 'victory',
      title: { opacity: 1, y: 0, rotate: -2.5, scale: 1.08 },
      contentDelay: 0.28,
      itemDelay: 0.12,
    }
    : {
      tone: 'defeat',
      title: { opacity: 1, y: 0, rotate: -2.5, scale: 1 },
      contentDelay: 0.42,
      itemDelay: 0.16,
    };
}
