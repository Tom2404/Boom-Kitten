export const VFX_QUALITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  REDUCED: 'reduced',
};

export function getVFXQuality() {
  if (typeof window === 'undefined') return VFX_QUALITY.MEDIUM;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return VFX_QUALITY.REDUCED;

  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 720;
  const memory = navigator.deviceMemory || 4;

  if (coarsePointer || smallScreen || memory <= 2) return VFX_QUALITY.LOW;
  if (memory <= 4 || window.devicePixelRatio > 2) return VFX_QUALITY.MEDIUM;
  return VFX_QUALITY.HIGH;
}

export function getParticleBudget(baseCount) {
  const quality = getVFXQuality();
  if (quality === VFX_QUALITY.REDUCED) return Math.min(baseCount, 8);
  if (quality === VFX_QUALITY.LOW) return Math.min(baseCount, 28);
  if (quality === VFX_QUALITY.MEDIUM) return Math.min(baseCount, 56);
  return Math.min(baseCount, 80);
}

export function getPixiResolution() {
  if (typeof window === 'undefined') return 1;
  const quality = getVFXQuality();
  const cap = quality === VFX_QUALITY.HIGH ? 2 : 1.5;
  return Math.min(window.devicePixelRatio || 1, cap);
}
