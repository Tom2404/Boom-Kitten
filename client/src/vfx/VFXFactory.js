import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import {
  CARD_FX_TIMING,
  PrimitiveEffects,
  getFxScale,
  getMainVfxSize,
  isReducedMotion,
} from './PrimitiveEffects';
import { soundManager } from './SoundManager';
import { VFX_ASSETS } from './config/vfxAssets';

const CARD_W = 120;
const CARD_H = 178;

const PALETTE = {
  ink: 0x111827,
  paper: 0xfffbeb,
  white: 0xffffff,
  cyan: 0x38bdf8,
  blue: 0x2563eb,
  indigo: 0x6366f1,
  red: 0xef233c,
  rose: 0xff006e,
  orange: 0xf97316,
  amber: 0xfacc15,
  yellow: 0xfde047,
  green: 0x22c55e,
  emerald: 0x10b981,
  violet: 0x8b5cf6,
  pink: 0xec4899,
  slate: 0x64748b,
};

const CARD_COLORS = {
  ATTACK: PALETTE.orange,
  ATTACK_2X: PALETTE.orange,
  TARGET_ATTACK: PALETTE.orange,
  TARGET_ATTACK_2X: PALETTE.orange,
  PERSONAL_ATTACK: PALETTE.orange,
  SKIP: PALETTE.cyan,
  SUPER_SKIP: PALETTE.indigo,
  REVERSE: PALETTE.emerald,
  SHUFFLE: PALETTE.amber,
  SHUFFLE_NOW: PALETTE.amber,
  NOPE: PALETTE.red,
  FAVOR: PALETTE.yellow,
  I_LL_TAKE_THAT: PALETTE.yellow,
  SEE_THE_FUTURE_1: PALETTE.violet,
  SEE_THE_FUTURE_3: PALETTE.violet,
  SEE_THE_FUTURE_5: PALETTE.violet,
  SEE_THE_FUTURE_3X: PALETTE.violet,
  SEE_THE_FUTURE_5X: PALETTE.violet,
  SEE_THE_FUTURE_3_AND_SHARE: PALETTE.violet,
  ALTER_THE_FUTURE_3: PALETTE.pink,
  ALTER_THE_FUTURE_3X: PALETTE.pink,
  ALTER_THE_FUTURE_5: PALETTE.pink,
  DEFUSE: PALETTE.green,
  EXPLODING_KITTEN: PALETTE.red,
};

const CAT_TYPES = new Set([
  'NORMAL_CAT',
  'CAT_TACO',
  'CAT_WATERMELON',
  'CAT_BEARD',
  'CAT_RAINBOW',
  'CAT_POTATO',
  'FERAL_CAT',
  'GODCAT',
]);

const getCenterPos = () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

const getBurstRadius = (ratio = 0.54) => Math.min(
  window.innerWidth * ratio * 0.5,
  window.innerHeight * 0.62,
);

const getMotionDuration = (normalDuration, reducedDuration = 0.85) => (
  isReducedMotion() ? Math.min(normalDuration, reducedDuration) : normalDuration
);

const getElementCenter = (id) => {
  if (!id || typeof document === 'undefined') return null;
  const element = document.getElementById(id);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

const getStartPos = (metadata) => (
  getElementCenter(metadata?.sourceId) || { x: window.innerWidth / 2, y: window.innerHeight + 100 }
);

const getTargetPos = (metadata) => (
  getElementCenter(metadata?.targetId) || getCenterPos()
);

const normalizeTypeLabel = (type) => {
  return String(type || 'CARD')
    .replace(/^CARD_/, '')
    .replaceAll('_', ' ')
    .slice(0, 18);
};

const safePlay = (soundKey) => {
  try {
    soundManager.play(soundKey);
  } catch (_) {}
};

const addLifecycleLabels = (tl) => {
  tl.addLabel('anticipation', 0);
  tl.addLabel('impact', 0.28);
  tl.addLabel('afterglow', 0.9);
  tl.addLabel('cleanup', 1.4);
  return tl;
};

const addArcadeBackdrop = (tl, vfxManager, position, options = {}) => {
  const {
    color,
    accent = PALETTE.white,
    radius = getBurstRadius(),
    duration = 0.95,
    opacity = 0.62,
    at = 0,
  } = options;

  tl.add(PrimitiveEffects.createRadialBurst(vfxManager, position, {
    color,
    accent,
    radius,
    duration,
    opacity,
  }), at);
};

const createCenteredSprite = (assetUrl) => {
  const sprite = PIXI.Sprite.from(assetUrl);
  sprite.anchor.set(0.5);
  sprite.roundPixels = true;
  return sprite;
};

const getFitScale = (sprite, maxWidth, maxHeight = maxWidth) => {
  const textureWidth = sprite.texture?.width || sprite.width || 1;
  const textureHeight = sprite.texture?.height || sprite.height || 1;
  const scale = Math.min(maxWidth / textureWidth, maxHeight / textureHeight);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};

const createPixelCard = (vfxManager, type, metadata = {}) => {
  if (!metadata.imageUrl) return null;

  const layer = vfxManager.getLayer('ACTIVE_CARD');
  if (!layer) return null;

  const card = new PIXI.Container();

  const shadow = new PIXI.Graphics();
  shadow.rect(-CARD_W / 2 + 8, -CARD_H / 2 + 8, CARD_W, CARD_H);
  shadow.fill({ color: 0x000000, alpha: 0.3 });
  card.addChild(shadow);

  const sprite = PIXI.Sprite.from(metadata.imageUrl);
  sprite.anchor.set(0.5);
  sprite.width = CARD_W;
  sprite.height = CARD_H;
  card.addChild(sprite);

  layer.addChild(card);
  return card;
};

const addPixelSlash = (vfxManager, pos, color = PALETTE.red) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const group = new PIXI.Container();
  group.position.set(pos.x, pos.y);
  layer.addChild(group);

  const fxScale = getFxScale();
  const slash = createCenteredSprite(VFX_ASSETS.slash);
  const baseScale = getFitScale(slash, 440 * fxScale, 340 * fxScale);
  slash.alpha = 0;
  slash.tint = color;
  slash.rotation = -0.08;
  slash.scale.set(baseScale * 0.34);
  group.addChild(slash);

  tl.to(slash, {
    alpha: 1,
    scaleX: baseScale * 1.08,
    scaleY: baseScale * 1.08,
    x: 28 * fxScale,
    duration: 0.1,
    ease: 'back.out(1.7)',
  }, 0).to(slash, {
    alpha: 0,
    scaleX: baseScale * 0.92,
    scaleY: baseScale * 0.92,
    x: 124 * fxScale,
    duration: 0.34,
    ease: 'power2.in',
  }, 0.18);

  tl.call(() => PrimitiveEffects.safeDestroy(group));
  return tl;
};

const addPixelCancelSlash = (vfxManager, pos) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const group = new PIXI.Container();
  group.position.set(pos.x, pos.y);
  layer.addChild(group);

  const slashA = PrimitiveEffects.makePixelRect(360, 20, PALETTE.red, 0.96);
  const slashB = PrimitiveEffects.makePixelRect(360, 20, PALETTE.red, 0.96);
  slashA.rotation = 0.68;
  slashB.rotation = -0.68;
  slashA.alpha = 0;
  slashB.alpha = 0;
  group.addChild(slashA, slashB);

  tl.to([slashA, slashB], { alpha: 1, scaleX: 1.05, duration: 0.08, ease: 'steps(2)' })
    .to([slashA, slashB], {
      alpha: 0,
      scaleX: 1.28,
      duration: 0.28,
      ease: 'steps(4)',
      onComplete: () => PrimitiveEffects.safeDestroy(group),
    }, '+=0.2');

  return tl;
};

const addNopeStampSprite = (vfxManager, pos) => {
  const layer = vfxManager.getLayer('UI_POPUP');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const fxScale = getFxScale();
  const stamp = createCenteredSprite(VFX_ASSETS.nopeStamp);
  const baseScale = getFitScale(stamp, 460 * fxScale, 360 * fxScale);
  stamp.position.set(pos.x, pos.y - 120 * fxScale);
  stamp.rotation = -0.08;
  stamp.alpha = 0;
  stamp.scale.set(baseScale * 1.85);
  layer.addChild(stamp);

  tl.to(stamp, {
    alpha: 1,
    y: pos.y,
    scaleX: baseScale * 1.04,
    scaleY: baseScale * 0.92,
    duration: 0.16,
    ease: 'back.out(1.7)',
  }, 0).to(stamp, {
    scaleX: baseScale * 0.96,
    scaleY: baseScale * 1.04,
    duration: 0.08,
    ease: 'steps(2)',
  }, 0.16).to(stamp, {
    alpha: 1,
    duration: 0.48,
  }, 0.24).to(stamp, {
    alpha: 0,
    y: pos.y - 18 * fxScale,
    scaleX: baseScale * 1.12,
    scaleY: baseScale * 1.12,
    duration: 0.24,
    ease: 'power2.in',
  }, 0.72).call(() => PrimitiveEffects.safeDestroy(stamp));

  return tl;
};

const addReverseArrowSpin = (vfxManager, pos) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const fxScale = getFxScale();
  const icon = createCenteredSprite(VFX_ASSETS.reverseArrow);
  const baseScale = getFitScale(icon, 340 * fxScale, 340 * fxScale);
  icon.position.set(pos.x, pos.y);
  icon.alpha = 0;
  icon.scale.set(baseScale * 0.24);
  layer.addChild(icon);

  tl.to(icon, {
    alpha: 1,
    scaleX: baseScale,
    scaleY: baseScale,
    rotation: Math.PI * 1.25,
    duration: isReducedMotion() ? 0.16 : 0.38,
    ease: 'back.out(1.5)',
  }, 0).to(icon, {
    rotation: `+=${Math.PI * 1.75}`,
    duration: isReducedMotion() ? 0.16 : 0.38,
    ease: 'steps(8)',
  }, 0.36).to(icon, {
    alpha: 0,
    scaleX: baseScale * 1.18,
    scaleY: baseScale * 1.18,
    duration: 0.24,
    ease: 'power2.in',
  }, 0.74).call(() => PrimitiveEffects.safeDestroy(icon));

  return tl;
};

const addExplosionSprite = (vfxManager, pos) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const fxScale = getFxScale();
  const explosion = createCenteredSprite(VFX_ASSETS.explosionSheet);
  const baseScale = getFitScale(explosion, 620 * fxScale, 620 * fxScale);
  explosion.position.set(pos.x, pos.y);
  explosion.alpha = 0;
  explosion.scale.set(baseScale * 0.22);
  layer.addChild(explosion);

  tl.to(explosion, {
    alpha: 1,
    scaleX: baseScale,
    scaleY: baseScale,
    rotation: 0.06,
    duration: isReducedMotion() ? 0.12 : 0.2,
    ease: 'back.out(1.8)',
  }, 0).to(explosion, {
    alpha: 0.82,
    scaleX: baseScale * 1.08,
    scaleY: baseScale * 1.08,
    duration: 0.28,
    ease: 'steps(4)',
  }, 0.2).to(explosion, {
    alpha: 0,
    scaleX: baseScale * 1.24,
    scaleY: baseScale * 1.24,
    duration: 0.34,
    ease: 'power2.in',
  }, 0.52).call(() => PrimitiveEffects.safeDestroy(explosion));

  return tl;
};

const addDefuseSprite = (vfxManager, pos) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const fxScale = getFxScale();
  const sprite = createCenteredSprite(VFX_ASSETS.defuse);
  const baseScale = getFitScale(sprite, 500 * fxScale, 500 * fxScale);
  sprite.position.set(pos.x, pos.y - 6 * fxScale);
  sprite.alpha = 0;
  sprite.scale.set(baseScale * 0.32);
  sprite.rotation = -0.12;
  layer.addChild(sprite);

  tl.to(sprite, {
    alpha: 1,
    rotation: 0.04,
    scaleX: baseScale * 1.08,
    scaleY: baseScale * 1.08,
    duration: isReducedMotion() ? 0.14 : 0.24,
    ease: 'back.out(1.6)',
  }, 0).to(sprite, {
    rotation: -0.03,
    scaleX: baseScale,
    scaleY: baseScale,
    duration: 0.18,
    ease: 'steps(3)',
  }, 0.24).to(sprite, {
    alpha: 1,
    duration: 0.42,
  }, 0.42).to(sprite, {
    alpha: 0,
    y: pos.y - 34 * fxScale,
    scaleX: baseScale * 1.16,
    scaleY: baseScale * 1.16,
    duration: 0.32,
    ease: 'power2.in',
  }, 0.84).call(() => PrimitiveEffects.safeDestroy(sprite));

  return tl;
};

const makeOutlinedArrow = (color = PALETTE.cyan, accent = PALETTE.white) => {
  const arrow = new PIXI.Container();

  const outline = new PIXI.Graphics();
  outline.poly([
    -150, -42,
    34, -42,
    34, -74,
    166, 0,
    34, 74,
    34, 42,
    -150, 42,
  ]);
  outline.fill(PALETTE.ink);
  arrow.addChild(outline);

  const body = new PIXI.Graphics();
  body.poly([
    -132, -26,
    52, -26,
    52, -52,
    132, 0,
    52, 52,
    52, 26,
    -132, 26,
  ]);
  body.fill(color);
  arrow.addChild(body);

  const highlight = new PIXI.Graphics();
  highlight.poly([
    -120, -23,
    44, -23,
    44, -37,
    92, -8,
    48, -8,
    48, -14,
    -120, -14,
  ]);
  highlight.fill({ color: accent, alpha: 0.82 });
  arrow.addChild(highlight);

  const shadow = new PIXI.Graphics();
  shadow.poly([
    -126, 14,
    48, 14,
    48, 28,
    94, 0,
    126, 0,
    50, 44,
    50, 26,
    -126, 26,
  ]);
  shadow.fill({ color: PALETTE.blue, alpha: 0.72 });
  arrow.addChild(shadow);

  const pixelNotches = [
    { x: -132, y: -42, w: 28, h: 16 },
    { x: -132, y: 42, w: 28, h: 16 },
    { x: 42, y: -64, w: 32, h: 16 },
    { x: 42, y: 64, w: 32, h: 16 },
  ];

  pixelNotches.forEach((piece) => {
    const notch = PrimitiveEffects.makePixelRect(piece.w, piece.h, PALETTE.ink, 1);
    notch.position.set(piece.x, piece.y);
    arrow.addChild(notch);
  });

  return arrow;
};

const addSkipArrowTravel = (vfxManager, pos, options = {}) => {
  const {
    color = PALETTE.cyan,
    accent = PALETTE.white,
    duration = 2.95,
  } = options;
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const fxScale = getFxScale();
  const reduced = isReducedMotion();
  const actualDuration = reduced ? 0.72 : duration;
  const spawnDuration = actualDuration * 0.21;
  const flyDuration = actualDuration * 0.46;
  const impactDuration = actualDuration * 0.33;
  const arrow = createCenteredSprite(VFX_ASSETS.skipArrow);
  const arrowScale = getFitScale(arrow, 360 * fxScale, 260 * fxScale);
  const travelY = Math.max(96 * fxScale, pos.y - 28 * fxScale);
  const horizontalPad = 92 * fxScale;
  const start = {
    x: Math.max(horizontalPad, Math.min(pos.x - 320 * fxScale, window.innerWidth * 0.18)),
    y: travelY + 18 * fxScale,
  };
  const target = {
    x: Math.min(window.innerWidth - horizontalPad, Math.max(pos.x + 320 * fxScale, window.innerWidth * 0.82)),
    y: travelY - 20 * fxScale,
  };
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const angle = Math.atan2(dy, dx);
  arrow.position.set(start.x, start.y);
  arrow.rotation = angle;
  arrow.scale.set(0.5 * arrowScale);
  arrow.alpha = 0;
  layer.addChild(arrow);

  const spawnPoint = { x: start.x - 78 * fxScale, y: start.y };
  addArcadeBackdrop(tl, vfxManager, spawnPoint, {
    color,
    accent,
    radius: 118 * fxScale,
    duration: spawnDuration * 1.08,
    opacity: 0.58,
    at: 0,
  });
  tl.add(PrimitiveEffects.PixelScreenFlash(vfxManager, accent, 0.08, 0.14), 0);
  tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, spawnPoint, {
    color: accent,
    accent: color,
    count: reduced ? 6 : 16,
    distance: 96 * fxScale,
    size: 6 * fxScale,
    duration: spawnDuration * 0.92,
  }), 0.05);

  tl.to(arrow, {
    alpha: 1,
    scaleX: 1.2 * arrowScale,
    scaleY: 1.2 * arrowScale,
    duration: spawnDuration * 0.56,
    ease: 'back.out(2)',
  }, 0.04).to(arrow, {
    scaleX: arrowScale,
    scaleY: arrowScale,
    duration: spawnDuration * 0.44,
    ease: 'steps(4)',
  }, spawnDuration * 0.48).to(arrow, {
    x: target.x,
    y: target.y,
    duration: flyDuration,
    ease: 'power2.in',
  }, spawnDuration).to(arrow, {
    x: target.x + Math.cos(angle) * 22 * fxScale,
    y: target.y + Math.sin(angle) * 22 * fxScale,
    scaleX: 1.1 * arrowScale,
    scaleY: 1.1 * arrowScale,
    duration: impactDuration * 0.18,
    ease: 'back.out(1.5)',
  }, spawnDuration + flyDuration - 0.03).to(arrow, {
    alpha: 0,
    scaleX: 0.94 * arrowScale,
    scaleY: 0.94 * arrowScale,
    duration: impactDuration * 0.45,
    ease: 'steps(5)',
    onComplete: () => PrimitiveEffects.safeDestroy(arrow),
  }, spawnDuration + flyDuration + impactDuration * 0.18);

  const trailGroup = new PIXI.Container();
  layer.addChild(trailGroup);
  const colors = [0x7df9ff, 0x3ddcff, color, PALETTE.blue, accent];
  const particleCount = reduced ? 12 : 46;
  const normal = { x: -Math.sin(angle), y: Math.cos(angle) };
  const back = { x: -Math.cos(angle), y: -Math.sin(angle) };

  for (let i = 0; i < particleCount; i += 1) {
    const progress = (i + 0.5) / particleCount;
    const baseX = start.x + dx * progress;
    const baseY = start.y + dy * progress;
    const side = ((i % 7) - 3) * 8 * fxScale;
    const size = (3 + (i % 4) * 2 + (i % 9 === 0 ? 3 : 0)) * fxScale;
    const particle = PrimitiveEffects.makePixelRect(size, size, colors[i % colors.length], 0.96);
    particle.position.set(baseX + normal.x * side, baseY + normal.y * side);
    particle.rotation = i % 2 ? 0 : angle;
    particle.alpha = 0;
    particle.scale.set(0.35);
    trailGroup.addChild(particle);

    const delay = spawnDuration * 0.62 + progress * flyDuration * 0.9;
    const life = (0.72 + (i % 6) * 0.11) * (actualDuration / duration);
    const drift = (34 + (i % 5) * 18) * fxScale;
    const spread = ((i % 5) - 2) * 18 * fxScale;
    tl.to(particle, {
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.06,
      ease: 'steps(2)',
    }, delay).to(particle, {
      x: particle.x + back.x * drift + normal.x * spread,
      y: particle.y + back.y * drift + normal.y * spread,
      alpha: 0,
      scaleX: i % 9 === 0 ? 0.55 : 0.25,
      scaleY: i % 9 === 0 ? 0.55 : 0.25,
      duration: life,
      ease: 'power2.out',
    }, delay + 0.06);
  }

  tl.add(PrimitiveEffects.createPixelTrail(vfxManager, {
    x: start.x - 44 * fxScale,
    y: start.y + 12 * fxScale,
  }, {
    x: target.x - 72 * fxScale,
    y: target.y + 12 * fxScale,
  }, {
    color,
    accent: 0x7df9ff,
    count: reduced ? 8 : 28,
    size: 8 * fxScale,
    duration: Math.max(0.54, flyDuration),
    spread: 64 * fxScale,
  }), spawnDuration * 0.74);

  tl.add(PrimitiveEffects.PixelRing(vfxManager, target, {
    color: accent,
    radius: 58 * fxScale,
    thickness: 10 * fxScale,
    duration: impactDuration * 0.72,
    alpha: 0.9,
  }), spawnDuration + flyDuration - 0.02);
  tl.add(PrimitiveEffects.PixelBurst(vfxManager, target, {
    color,
    count: reduced ? 10 : 30,
    distance: 128 * fxScale,
    size: 9 * fxScale,
    duration: impactDuration * 0.78,
    shape: 'square',
  }), spawnDuration + flyDuration);
  tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, target, {
    color: 0x7df9ff,
    accent: PALETTE.blue,
    count: reduced ? 8 : 22,
    distance: 118 * fxScale,
    size: 5 * fxScale,
    duration: impactDuration * 0.86,
  }), spawnDuration + flyDuration + 0.08);

  tl.call(() => PrimitiveEffects.safeDestroy(trailGroup), null, actualDuration + 0.2);

  return tl;
};

const addShuffleCards = (vfxManager, pos) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const fxScale = getFxScale();
  const group = new PIXI.Container();
  group.position.set(pos.x, pos.y);
  group.scale.set(fxScale);
  layer.addChild(group);

  const icon = createCenteredSprite(VFX_ASSETS.shuffle);
  const iconScale = getFitScale(icon, 440 * fxScale, 300 * fxScale) / fxScale;
  icon.alpha = 0;
  icon.rotation = -0.18;
  icon.scale.set(iconScale * 0.42);
  group.addChild(icon);

  tl.to(icon, {
    alpha: 1,
    scaleX: iconScale,
    scaleY: iconScale,
    rotation: 0.12,
    duration: isReducedMotion() ? 0.16 : 0.28,
    ease: 'back.out(1.6)',
  }, 0).to(icon, {
    rotation: Math.PI * 2.15,
    duration: isReducedMotion() ? 0.18 : 0.58,
    ease: 'steps(12)',
  }, 0.24).to(icon, {
    alpha: 0,
    scaleX: iconScale * 1.18,
    scaleY: iconScale * 1.18,
    duration: 0.3,
    ease: 'power2.in',
  }, 0.92);

  for (let i = 0; i < 9; i += 1) {
    const tile = PrimitiveEffects.makePixelCard('?', i % 2 ? PALETTE.amber : PALETTE.white);
    tile.scale.set(0.8);
    tile.alpha = 0;
    group.addChild(tile);
    const angle = (Math.PI * 2 * i) / 9;
    const radius = 104 + (i % 3) * 34;
    tl.to(tile, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotation: angle + Math.PI * 2,
      alpha: 1,
      duration: 0.62,
      ease: 'power2.out',
    }, i * 0.025).to(tile, {
      x: 0,
      y: 0,
      rotation: angle + Math.PI * 4,
      alpha: 0,
      duration: 0.58,
      ease: 'power2.inOut',
    }, 0.62 + i * 0.018);
  }

  tl.call(() => PrimitiveEffects.safeDestroy(group));
  return tl;
};

const addFuturePeek = (vfxManager, pos, count = 3, type = 'SEE_THE_FUTURE_3') => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const fxScale = getFxScale();
  const isAlter = type.startsWith('ALTER_THE_FUTURE');
  const assetUrl = isAlter ? VFX_ASSETS.alterFuture : VFX_ASSETS.seeFuture;
  const accent = isAlter ? PALETTE.pink : PALETTE.cyan;
  const group = new PIXI.Container();
  group.position.set(pos.x, pos.y);
  group.scale.set(fxScale);
  layer.addChild(group);

  const icon = createCenteredSprite(assetUrl);
  const iconScale = getFitScale(icon, 420 * fxScale, 420 * fxScale) / fxScale;
  icon.alpha = 0;
  icon.rotation = isAlter ? -0.12 : 0.1;
  icon.scale.set(iconScale * 0.36);
  group.addChild(icon);

  tl.to(icon, {
    alpha: 1,
    scaleX: iconScale,
    scaleY: iconScale,
    rotation: isAlter ? 0.08 : -0.04,
    duration: isReducedMotion() ? 0.14 : 0.26,
    ease: 'back.out(1.6)',
  }, 0).to(icon, {
    alpha: 0.88,
    scaleX: iconScale * 1.05,
    scaleY: iconScale * 1.05,
    duration: 0.32,
    ease: 'steps(4)',
  }, 0.28).to(icon, {
    alpha: 0,
    y: icon.y - 18,
    scaleX: iconScale * 1.14,
    scaleY: iconScale * 1.14,
    duration: 0.28,
    ease: 'power2.in',
  }, 0.9);

  for (let i = 0; i < count; i += 1) {
    const card = PrimitiveEffects.makePixelCard(String(i + 1), isAlter ? PALETTE.pink : PALETTE.violet);
    card.position.set((i - (count - 1) / 2) * 72, 62);
    card.rotation = (i - 1) * 0.12;
    card.scale.set(0.28);
    card.alpha = 0;
    group.addChild(card);
    tl.to(card, {
      y: 34,
      scaleX: 0.82,
      scaleY: 0.82,
      alpha: 1,
      duration: 0.24,
      ease: 'back.out(1.4)',
    }, 0.22 + i * 0.1);
  }

  for (let i = 0; i < 6; i += 1) {
    const scan = PrimitiveEffects.makePixelRect(280, 6, i % 2 ? PALETTE.white : accent, 0.7);
    scan.position.set(0, -76 + i * 28);
    scan.alpha = 0;
    group.addChild(scan);
    tl.to(scan, { alpha: 1, x: 26, duration: 0.08, ease: 'steps(2)' }, 0.18 + i * 0.045)
      .to(scan, { alpha: 0, x: -26, duration: 0.14, ease: 'steps(3)' }, 0.32 + i * 0.045);
  }

  tl.to(group, { alpha: 0, y: group.y - 18, duration: 0.3, ease: 'power2.in' }, '+=0.52')
    .call(() => PrimitiveEffects.safeDestroy(group));

  return tl;
};

const addFavorBeam = (vfxManager, start, end) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const group = new PIXI.Container();
  layer.addChild(group);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(80, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);
  const steps = Math.max(5, Math.floor(length / 52));

  const fxScale = getFxScale();
  for (let i = 0; i < steps; i += 1) {
    const pixel = PrimitiveEffects.makePixelRect(34 * fxScale, 16 * fxScale, i % 2 ? PALETTE.white : PALETTE.yellow, 0.92);
    pixel.position.set(start.x, start.y);
    pixel.rotation = angle;
    pixel.alpha = 0;
    group.addChild(pixel);
    const progress = (i + 1) / steps;
    tl.to(pixel, {
      x: start.x + dx * progress,
      y: start.y + dy * progress,
      alpha: 1,
      duration: 0.42,
      ease: 'power2.out',
    }, i * 0.035).to(pixel, {
      alpha: 0,
      duration: 0.26,
      ease: 'power2.in',
    }, 0.42 + i * 0.035);
  }

  tl.call(() => PrimitiveEffects.safeDestroy(group));
  return tl;
};

const addDefuseShield = (vfxManager, pos) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const tl = gsap.timeline();
  if (!layer) return tl;

  const shield = new PIXI.Container();
  shield.position.set(pos.x, pos.y);
  shield.scale.set(getFxScale());
  layer.addChild(shield);

  const colors = [PALETTE.green, PALETTE.emerald, PALETTE.white];
  for (let i = 0; i < 3; i += 1) {
    const ring = new PIXI.Graphics();
    ring.circle(0, 0, 96 + i * 38);
    ring.stroke({ width: 14, color: colors[i], alpha: 0.82 });
    ring.scale.set(0.2);
    ring.alpha = 0;
    shield.addChild(ring);
    tl.to(ring, {
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 0.32,
      ease: 'back.out(1.4)',
    }, i * 0.07).to(ring, {
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0,
      duration: 0.62,
      ease: 'power2.out',
    }, 0.32 + i * 0.07);
  }

  const plus = new PIXI.Text({
    text: '+',
    style: {
      fontFamily: 'monospace',
      fontSize: 156,
      fill: PALETTE.green,
      fontWeight: '900',
      stroke: { color: PALETTE.ink, width: 8 },
    },
  });
  plus.anchor.set(0.5);
  plus.scale.set(0.4);
  plus.alpha = 0;
  shield.addChild(plus);

  tl.to(plus, { alpha: 1, scaleX: 1, scaleY: 1, duration: 0.24, ease: 'back.out(1.5)' }, 0.1)
    .to(plus, { alpha: 1, duration: 0.45 }, 0.36)
    .to(plus, { alpha: 0, duration: 0.32, ease: 'power2.in' }, 0.86)
    .call(() => PrimitiveEffects.safeDestroy(shield));

  return tl;
};

const addGenericPop = (vfxManager, pos, color = PALETTE.slate) => {
  const tl = gsap.timeline();
  tl.add(PrimitiveEffects.PixelRing(vfxManager, pos, { color, radius: 62, duration: 0.32 }));
  tl.add(PrimitiveEffects.PixelBurst(vfxManager, pos, {
    color,
    count: 14,
    distance: 120,
    size: 9,
    duration: 0.38,
    shape: 'square',
  }), 0.04);
  return tl;
};

const exitCard = (tl, card, type, metadata) => {
  const target = getTargetPos(metadata);
  if (type === 'SKIP' || type === 'SUPER_SKIP') {
    tl.to(card, {
      x: window.innerWidth + 160,
      alpha: 0,
      rotation: 0.35,
      scaleX: 0.88,
      scaleY: 0.88,
      duration: isReducedMotion() ? 0.1 : 0.22,
      ease: 'steps(5)',
    });
    return;
  }

  tl.to(card, {
    x: target.x,
    y: target.y,
    alpha: 0,
    rotation: 0.12,
    scaleX: 0.75,
    scaleY: 0.75,
    duration: isReducedMotion() ? 0.1 : 0.24,
    ease: 'steps(4)',
  });
};

export const VFXFactory = {
  createAnimation: (vfxManager, cardData, eventMetadata = {}) => {
    const tl = addLifecycleLabels(gsap.timeline());
    const type = cardData?.type || 'GENERIC';
    const center = getCenterPos();
    const start = getStartPos(eventMetadata);
    const target = getTargetPos(eventMetadata);
    const card = createPixelCard(vfxManager, type, eventMetadata);
    const color = CARD_COLORS[type] || (CAT_TYPES.has(type) ? PALETTE.amber : PALETTE.slate);
    const fxScale = getFxScale();

    if (card) {
      tl.add(PrimitiveEffects.Trajectory(card, start, center, isReducedMotion() ? 0.1 : 0.24));
      tl.to(card, {
        scaleX: CAT_TYPES.has(type) ? 1.18 * fxScale : 1.08 * fxScale,
        scaleY: CAT_TYPES.has(type) ? 1.18 * fxScale : 1.08 * fxScale,
        duration: isReducedMotion() ? 0.06 : 0.12,
        ease: 'back.out(1.4)',
      }, '-=0.08');
    }

    switch (type) {
      case 'SKIP':
      case 'SUPER_SKIP': {
        const isSuper = type === 'SUPER_SKIP';
        const mainColor = isSuper ? PALETTE.indigo : PALETTE.cyan;
        addArcadeBackdrop(tl, vfxManager, center, {
          color: mainColor,
          radius: getBurstRadius(isSuper ? 0.62 : 0.52),
          duration: CARD_FX_TIMING.skip * 0.78,
          at: '-=0.06',
        });
        tl.add(PrimitiveEffects.CameraZoom(vfxManager, isSuper ? 0.86 : 0.92, 0.12), '-=0.02');
        tl.add(addSkipArrowTravel(vfxManager, center, {
          color: mainColor,
          accent: PALETTE.white,
          duration: isSuper ? 3.08 : 2.95,
        }), '-=0.1');
        tl.add(PrimitiveEffects.PixelSpeedStreaks(vfxManager, {
          color: mainColor,
          accent: PALETTE.white,
          count: isReducedMotion() ? 8 : (isSuper ? 24 : 18),
          duration: isReducedMotion() ? 0.22 : 0.62,
        }), '-=1.28');
        tl.add(PrimitiveEffects.PixelArrowBurst(vfxManager, center, {
          color: mainColor,
          accent: PALETTE.white,
          count: isReducedMotion() ? 2 : (isSuper ? 5 : 3),
          duration: isReducedMotion() ? 0.32 : 0.74,
        }), '-=0.82');
        tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, center, {
          color: mainColor,
          accent: PALETTE.white,
          count: isReducedMotion() ? 8 : (isSuper ? 30 : 22),
          distance: 150 * fxScale,
          size: 6 * fxScale,
          duration: isReducedMotion() ? 0.34 : 0.86,
        }), '-=0.62');
        tl.add(PrimitiveEffects.CameraReset(vfxManager, 0.12), '-=0.24');
        safePlay('sfx_swoosh');
        break;
      }

      case 'ATTACK':
      case 'ATTACK_2X':
      case 'TARGET_ATTACK':
      case 'TARGET_ATTACK_2X':
      case 'PERSONAL_ATTACK':
        addArcadeBackdrop(tl, vfxManager, center, {
          color: PALETTE.orange,
          accent: PALETTE.white,
          radius: getBurstRadius(0.58),
          duration: CARD_FX_TIMING.attack * 0.62,
          at: '-=0.04',
        });
        tl.add(PrimitiveEffects.PixelScreenFlash(vfxManager, PALETTE.orange, 0.18, 0.18), '-=0.1');
        tl.add(addPixelSlash(vfxManager, center, PALETTE.red), '-=0.08');
        if (type.includes('2X')) {
          tl.add(addPixelSlash(vfxManager, {
            x: center.x + 42 * fxScale,
            y: center.y - 26 * fxScale,
          }, PALETTE.orange), '-=0.54');
        }
        tl.add(PrimitiveEffects.createPixelTrail(vfxManager, {
          x: center.x - 260 * fxScale,
          y: center.y + 120 * fxScale,
        }, {
          x: center.x + 260 * fxScale,
          y: center.y - 120 * fxScale,
        }, {
          color: PALETTE.orange,
          accent: PALETTE.white,
          count: type.includes('2X') ? 34 : 26,
          size: 11 * fxScale,
          duration: 0.72,
          spread: 84,
        }), '-=0.42');
        tl.add(PrimitiveEffects.PixelBurst(vfxManager, center, {
          color: PALETTE.orange,
          count: type.includes('2X') ? 36 : 26,
          distance: (type.includes('2X') ? 260 : 200) * fxScale,
          size: 13 * fxScale,
          duration: 0.64,
          shape: 'square',
        }), '-=0.3');
        tl.add(PrimitiveEffects.ScreenShake(vfxManager, type.includes('2X') ? 16 : 11, 0.16), '-=0.44');
        safePlay('sfx_attack');
        break;

      case 'NOPE':
        tl.add(PrimitiveEffects.HitStop(0.08));
        addArcadeBackdrop(tl, vfxManager, center, {
          color: PALETTE.rose,
          accent: PALETTE.white,
          radius: getBurstRadius(0.62),
          duration: CARD_FX_TIMING.nope * 0.66,
          opacity: 0.68,
          at: '-=0.02',
        });
        tl.add(addNopeStampSprite(vfxManager, center), '-=0.04');
        tl.add(addPixelCancelSlash(vfxManager, center), '-=0.82');
        tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, center, {
          color: PALETTE.red,
          accent: PALETTE.white,
          count: 24,
          distance: 170 * fxScale,
          size: 7 * fxScale,
          duration: 0.8,
        }), '-=0.62');
        tl.add(PrimitiveEffects.ScreenShake(vfxManager, 16, 0.16), '-=0.76');
        safePlay('sfx_nope');
        break;

      case 'SHUFFLE':
      case 'SHUFFLE_NOW':
        addArcadeBackdrop(tl, vfxManager, center, {
          color: PALETTE.violet,
          accent: PALETTE.amber,
          radius: getBurstRadius(0.56),
          duration: CARD_FX_TIMING.shuffle * 0.72,
          at: '-=0.02',
        });
        tl.add(addShuffleCards(vfxManager, center), '-=0.05');
        tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, center, {
          color: PALETTE.amber,
          accent: PALETTE.violet,
          count: 26,
          distance: 190 * fxScale,
          size: 7 * fxScale,
          duration: 0.9,
        }), '-=0.65');
        tl.add(PrimitiveEffects.PixelRing(vfxManager, center, { color: PALETTE.amber, radius: 122 * fxScale, duration: 0.72 }), '-=0.8');
        tl.add(PrimitiveEffects.CameraZoom(vfxManager, 1.06, 0.14), '-=0.72');
        tl.add(PrimitiveEffects.CameraReset(vfxManager, 0.12), '-=0.2');
        safePlay('sfx_swoosh');
        break;

      case 'SEE_THE_FUTURE_1':
      case 'SEE_THE_FUTURE_3':
      case 'SEE_THE_FUTURE_5':
      case 'SEE_THE_FUTURE_3X':
      case 'SEE_THE_FUTURE_5X':
      case 'SEE_THE_FUTURE_3_AND_SHARE':
      case 'ALTER_THE_FUTURE_3':
      case 'ALTER_THE_FUTURE_3X':
      case 'ALTER_THE_FUTURE_5': {
        const count = type.includes('_5') ? 5 : (type.includes('_1') ? 1 : 3);
        addArcadeBackdrop(tl, vfxManager, center, {
          color: PALETTE.cyan,
          accent: color,
          radius: getBurstRadius(0.52),
          duration: CARD_FX_TIMING.see_the_future_3 * 0.7,
          opacity: 0.5,
          at: '-=0.02',
        });
        tl.add(PrimitiveEffects.PixelRing(vfxManager, center, { color, radius: 116 * fxScale, duration: 0.58 }), '-=0.03');
        tl.add(addFuturePeek(vfxManager, center, count, type), '-=0.42');
        tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, center, {
          color: PALETTE.cyan,
          accent: color,
          count: 14 + count * 3,
          distance: 132 * fxScale,
          size: 6 * fxScale,
          duration: 0.7,
        }), '-=0.62');
        safePlay('sfx_swoosh');
        break;
      }

      case 'FAVOR':
      case 'I_LL_TAKE_THAT':
        addArcadeBackdrop(tl, vfxManager, {
          x: (center.x + target.x) / 2,
          y: (center.y + target.y) / 2,
        }, {
          color: PALETTE.yellow,
          accent: PALETTE.white,
          radius: getBurstRadius(0.44),
          duration: CARD_FX_TIMING.favor * 0.62,
          opacity: 0.48,
          at: '-=0.02',
        });
        tl.add(addFavorBeam(vfxManager, center, target), '-=0.04');
        tl.add(PrimitiveEffects.createPixelTrail(vfxManager, center, target, {
          color: PALETTE.yellow,
          accent: PALETTE.white,
          count: 24,
          size: 10 * fxScale,
          duration: 0.68,
          spread: 58,
        }), '-=0.46');
        tl.add(PrimitiveEffects.createOutlinedIconPop(vfxManager, {
          x: (center.x + target.x) / 2,
          y: (center.y + target.y) / 2,
        }, {
          text: 'GIFT',
          color: PALETTE.yellow,
          fontSize: 58,
          duration: 0.72,
          hold: 0.18,
          rotation: 0.08,
        }), '-=0.3');
        break;

      case 'REVERSE':
        addArcadeBackdrop(tl, vfxManager, center, {
          color: PALETTE.emerald,
          accent: PALETTE.white,
          radius: getBurstRadius(0.46),
          duration: 0.72,
          at: '-=0.02',
        });
        tl.add(addReverseArrowSpin(vfxManager, center), '-=0.04');
        tl.add(PrimitiveEffects.PixelRing(vfxManager, center, { color: PALETTE.emerald, radius: 124 * fxScale, duration: 0.58 }), '-=0.58');
        tl.add(PrimitiveEffects.PixelBurst(vfxManager, center, {
          color: PALETTE.emerald,
          count: isReducedMotion() ? 10 : 24,
          distance: 150 * fxScale,
          size: 8 * fxScale,
          duration: 0.62,
          shape: 'square',
        }), '-=0.52');
        if (card) {
          tl.to(card, { rotation: Math.PI * 2, duration: isReducedMotion() ? 0.12 : 0.42, ease: 'steps(8)' }, '-=0.58');
        }
        safePlay('sfx_turn');
        break;

      default:
        if (CAT_TYPES.has(type)) {
          addArcadeBackdrop(tl, vfxManager, center, {
            color: PALETTE.amber,
            accent: PALETTE.white,
            radius: getBurstRadius(0.42),
            duration: CARD_FX_TIMING.cat_fallback * 0.7,
            opacity: 0.46,
            at: '-=0.02',
          });
          tl.add(PrimitiveEffects.createStampHold(vfxManager, 'CAT!', center, {
            color: PALETTE.amber,
            fontSize: 72,
            duration: 0.72,
            hold: 0.16,
            rotation: 0.08,
          }), '-=0.14');
          tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, center, {
            color: PALETTE.amber,
            accent: PALETTE.white,
            count: 18,
            distance: 125 * fxScale,
            size: 6 * fxScale,
            duration: 0.58,
          }), '-=0.52');
        } else {
          addArcadeBackdrop(tl, vfxManager, center, {
            color,
            accent: PALETTE.white,
            radius: getBurstRadius(0.4),
            duration: 0.65,
            opacity: 0.42,
            at: '-=0.02',
          });
          tl.add(addGenericPop(vfxManager, center, color), '-=0.1');
        }
        break;
    }

    if (card) {
      exitCard(tl, card, type, eventMetadata);
      tl.call(() => PrimitiveEffects.safeDestroy(card));
    }
    return tl;
  },

  createExplodingKitten: (vfxManager) => {
    const tl = addLifecycleLabels(gsap.timeline());
    const center = getCenterPos();
    const fxScale = getFxScale();

    tl.add(PrimitiveEffects.PixelVignette(vfxManager, PALETTE.red, getMotionDuration(0.82, 0.32)));
    addArcadeBackdrop(tl, vfxManager, center, {
      color: PALETTE.red,
      accent: PALETTE.orange,
      radius: getBurstRadius(0.86),
      duration: CARD_FX_TIMING.exploding_kitten * 0.72,
      opacity: 0.78,
      at: '-=0.7',
    });
    tl.add(PrimitiveEffects.PixelScreenFlash(vfxManager, PALETTE.orange, 0.16, 0.2), '-=0.64');
    tl.add(addExplosionSprite(vfxManager, center), '-=0.6');
    tl.add(PrimitiveEffects.createStampHold(vfxManager, 'BOOM!', center, {
      color: PALETTE.red,
      fontSize: 112,
      duration: 1.18,
      hold: 0.6,
      rotation: 0,
    }), '-=0.48');
    tl.add(PrimitiveEffects.PixelBurst(vfxManager, center, {
      color: PALETTE.orange,
      count: isReducedMotion() ? 18 : 46,
      distance: (isReducedMotion() ? 130 : 330) * fxScale,
      size: 15 * fxScale,
      duration: 0.82,
      shape: 'square',
    }), '-=0.64');
    tl.add(PrimitiveEffects.PixelBurst(vfxManager, center, {
      color: PALETTE.red,
      count: isReducedMotion() ? 12 : 34,
      distance: (isReducedMotion() ? 110 : 250) * fxScale,
      size: 12 * fxScale,
      duration: 0.76,
      shape: 'square',
    }), '-=0.74');
    tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, center, {
      color: PALETTE.white,
      accent: PALETTE.orange,
      count: 28,
      distance: 210 * fxScale,
      size: 7 * fxScale,
      duration: 0.95,
    }), '-=0.58');
    tl.add(PrimitiveEffects.ScreenShake(vfxManager, isReducedMotion() ? 0 : 22, 0.26), '-=0.72');
    safePlay('sfx_explosion');

    return tl;
  },

  createDefuse: (vfxManager, eventMetadata = {}) => {
    const tl = addLifecycleLabels(gsap.timeline());
    const center = getCenterPos();
    const fxScale = getFxScale();

    addArcadeBackdrop(tl, vfxManager, center, {
      color: PALETTE.green,
      accent: PALETTE.white,
      radius: getBurstRadius(0.7),
      duration: CARD_FX_TIMING.defuse * 0.68,
      opacity: 0.68,
      at: '-=0.02',
    });
    tl.add(PrimitiveEffects.PixelScreenFlash(vfxManager, PALETTE.green, 0.18, 0.18), '-=0.08');
    tl.add(addDefuseSprite(vfxManager, center), '-=0.1');
    tl.add(addDefuseShield(vfxManager, center), '-=0.06');
    tl.add(PrimitiveEffects.PixelBurst(vfxManager, center, {
      color: PALETTE.green,
      count: isReducedMotion() ? 14 : 30,
      distance: 210 * fxScale,
      size: 11 * fxScale,
      duration: 0.72,
    }), '-=0.72');
    tl.add(PrimitiveEffects.createPixelSparkleBurst(vfxManager, center, {
      color: PALETTE.green,
      accent: PALETTE.white,
      count: 26,
      distance: 170 * fxScale,
      size: 7 * fxScale,
      duration: 0.9,
    }), '-=0.62');
    tl.add(PrimitiveEffects.createStampHold(vfxManager, 'DEFUSED!', {
      x: center.x,
      y: center.y + 122 * fxScale,
    }, {
      color: PALETTE.green,
      fontSize: 58,
      duration: 0.92,
      hold: 0.45,
      rotation: 0,
    }), '-=0.6');

    return tl;
  },

  createDrawCard: (vfxManager, eventMetadata = {}) => {
    const tl = addLifecycleLabels(gsap.timeline());
    const target = getElementCenter(eventMetadata.targetId) || {
      x: window.innerWidth / 2,
      y: window.innerHeight - 120,
    };
    const start = { x: window.innerWidth / 2, y: window.innerHeight / 2 - 40 };
    const fxScale = getFxScale();

    tl.add(PrimitiveEffects.createPixelTrail(vfxManager, start, target, {
      color: PALETTE.cyan,
      accent: PALETTE.white,
      count: isReducedMotion() ? 6 : 18,
      size: 7 * fxScale,
      duration: isReducedMotion() ? 0.12 : 0.34,
      spread: 44 * fxScale,
    }));
    tl.add(PrimitiveEffects.PixelRing(vfxManager, target, {
      color: PALETTE.cyan,
      radius: 52 * fxScale,
      thickness: 7 * fxScale,
      duration: 0.3,
      alpha: 0.85,
    }), '-=0.16');
    tl.add(PrimitiveEffects.PixelBurst(vfxManager, target, {
      color: PALETTE.white,
      count: isReducedMotion() ? 6 : 12,
      distance: 86 * fxScale,
      size: 7 * fxScale,
      duration: 0.26,
    }), '-=0.18');

    return tl;
  },
};
