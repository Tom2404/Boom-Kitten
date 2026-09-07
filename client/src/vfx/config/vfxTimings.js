export const VFX_TIMINGS = {
  quick: 0.8,
  standard: 1.45,
  dramatic: 2.25,
  skipArrow: 2.95,
};

export const VFX_PHASES = {
  anticipation: 'anticipation',
  impact: 'impact',
  afterglow: 'afterglow',
  cleanup: 'cleanup',
};

/** Every card-flight duration lives here, named after the beat it plays. */
export const CARD_TIMINGS = {
  anticipation: 0.18,
  deckRecoil: 0.12,
  travel: 0.42,
  flipOffset: 0.2,
  // A drawn card has to stop and get big enough to read, or the whole flight
  // registers as "something moved" instead of "I drew Defuse".
  revealHold: 0.55,
  revealScale: 1.8,
  settle: 0.2,
  playFlight: 0.3,
  nopeFlight: 0.4,
  discard: 0.35,
  reduced: 0.01,
  // Minimum time a played card stays readable at center, even if the server
  // resolves instantly.
  minHold: VFX_TIMINGS.quick,
  minHoldNoped: VFX_TIMINGS.standard,
};

/**
 * Single source of truth for reduced motion across the VFX layer.
 * ponytail: read on demand instead of gsap.matchMedia(); upgrade when we need
 * live re-choreography while the user flips the OS preference mid-match.
 */
export const isReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/** Reduced motion shortens a beat; it never removes it — cards must still arrive. */
export const motionDuration = (seconds) => (isReducedMotion() ? CARD_TIMINGS.reduced : seconds);
