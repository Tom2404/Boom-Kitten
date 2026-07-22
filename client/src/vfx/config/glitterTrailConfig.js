const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toHex = (color) => Math.max(0, Number(color) || 0)
  .toString(16)
  .padStart(6, '0')
  .slice(-6);

const allocateLayerBudget = (budget) => {
  const total = Math.max(3, Math.floor(budget));
  const sparkles = Math.max(1, Math.round(total * 0.1));
  const flecks = Math.max(1, Math.round(total * 0.25));
  const dust = Math.max(1, total - flecks - sparkles);
  return { dust, flecks, sparkles };
};

export function createTrailSeed(start, end, salt = 0) {
  const values = [start?.x, start?.y, end?.x, end?.y, salt];
  let hash = 2166136261;

  values.forEach((value) => {
    const normalized = Math.round((Number(value) || 0) * 1000);
    hash ^= normalized;
    hash = Math.imul(hash, 16777619);
  });

  return hash >>> 0;
}

const seededUnit = (seed, channel) => {
  let value = (seed + Math.imul(channel + 1, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x21f0aaad);
  value ^= value >>> 15;
  value = Math.imul(value, 0x735a2d97);
  value ^= value >>> 15;
  return (value >>> 0) / 4294967296;
};

export function sampleGlitterTrailPoint(start, end, progress, options = {}) {
  const t = clamp(Number(progress) || 0, 0, 1);
  if (t === 0) return { x: start.x, y: start.y };
  if (t === 1) return { x: end.x, y: end.y };

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const normalX = -dy / length;
  const normalY = dx / length;
  const seed = Number(options.seed) >>> 0;
  const spread = Math.max(0, Number(options.spread) || 0);
  const phaseA = seededUnit(seed, 0) * Math.PI * 2;
  const phaseB = seededUnit(seed, 1) * Math.PI * 2;
  const phaseC = seededUnit(seed, 2) * Math.PI * 2;
  const envelope = Math.sin(Math.PI * t);
  const noise = (
    Math.sin(t * Math.PI * 3.2 + phaseA) * 0.56
    + Math.sin(t * Math.PI * 7.7 + phaseB) * 0.29
    + Math.sin(t * Math.PI * 13.1 + phaseC) * 0.15
  );
  const offset = noise * spread * 0.2 * envelope;

  return {
    x: start.x + dx * t + normalX * offset,
    y: start.y + dy * t + normalY * offset,
  };
}

export function createGlitterTrailBlueprints(options = {}) {
  const {
    color = 0x38bdf8,
    accent = 0xffffff,
    count = 26,
    size = 12,
    spread = 44,
    particleBudget = count,
    duration = 0.72,
  } = options;
  const total = Math.max(3, Math.min(Math.floor(count), Math.floor(particleBudget)));
  const budget = allocateLayerBudget(total);
  const emissionDuration = Math.max(0.12, Number(duration) || 0.72);
  const baseSize = Math.max(2, Number(size) || 12);
  const drift = Math.max(4, Number(spread) || 44);
  const baseColor = toHex(color);
  const highlightColor = toHex(accent);

  return [
    {
      id: 'dust',
      maxParticles: budget.dust,
      frequency: emissionDuration / budget.dust,
      lifetime: { min: 0.42, max: 0.82 },
      alpha: [
        { value: 0, time: 0 },
        { value: 0.62, time: 0.08 },
        { value: 0.28, time: 0.58 },
        { value: 0, time: 1 },
      ],
      scale: { start: (baseSize / 32) * 0.9, end: (baseSize / 32) * 0.18, minMult: 0.38 },
      speed: { start: drift * 1.35, end: drift * 0.12, minMult: 0.28 },
      rotation: { minStart: 0, maxStart: 360, minSpeed: -35, maxSpeed: 35 },
      spawnRadius: Math.max(2, drift * 0.12),
      color: { start: baseColor, end: highlightColor },
      blendMode: 'add',
      textureFamily: ['soft', 'grain'],
    },
    {
      id: 'flecks',
      maxParticles: budget.flecks,
      frequency: emissionDuration / budget.flecks,
      lifetime: { min: 0.28, max: 0.62 },
      alpha: [
        { value: 0, time: 0 },
        { value: 0.92, time: 0.05 },
        { value: 0.5, time: 0.48 },
        { value: 0, time: 1 },
      ],
      scale: { start: (baseSize / 32) * 1.15, end: (baseSize / 32) * 0.2, minMult: 0.5 },
      speed: { start: drift * 1.8, end: drift * 0.18, minMult: 0.4 },
      rotation: { minStart: 0, maxStart: 360, minSpeed: -150, maxSpeed: 150 },
      spawnRadius: Math.max(2, drift * 0.08),
      color: { start: highlightColor, end: baseColor },
      blendMode: 'add',
      textureFamily: ['fleck', 'grain'],
    },
    {
      id: 'sparkles',
      maxParticles: budget.sparkles,
      frequency: emissionDuration / budget.sparkles,
      lifetime: { min: 0.18, max: 0.42 },
      alpha: [
        { value: 0, time: 0 },
        { value: 1, time: 0.06 },
        { value: 0.86, time: 0.3 },
        { value: 0, time: 1 },
      ],
      scale: { start: (baseSize / 36) * 1.25, end: (baseSize / 36) * 0.18, minMult: 0.62 },
      speed: { start: drift * 1.1, end: drift * 0.08, minMult: 0.3 },
      rotation: { minStart: 0, maxStart: 360, minSpeed: -90, maxSpeed: 90 },
      spawnRadius: Math.max(1, drift * 0.05),
      color: { start: 'ffffff', end: highlightColor },
      blendMode: 'add',
      textureFamily: ['sparkle', 'soft'],
    },
  ];
}
