import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export const isReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const getFxScale = (width = window.innerWidth, height = window.innerHeight) => {
  // Target 50% of the shorter viewport edge (vmin) for main card VFX.
  // The base 720 ensures correct scaling on a reference resolution.
  const vmin = Math.min(width, height);
  const base = vmin / 720;
  return clamp(base, 1.15, 2.2);
};

/**
 * Returns the pixel size for a main card VFX container.
 * Targets 50vmin, clamped between 280px and 620px.
 * Use this for CARD_* animation containers so they are always clearly visible.
 */
export const getMainVfxSize = () => {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(280, Math.min(620, vmin * 0.5));
};

export const RETRO_ARCADE_TIMING = {
  quick: 1.0,
  standard: 1.45,
  cinematic: 1.8,
  dramatic: 2.25,
};

// VFX_TIMING (ms) — how long each category of main VFX should display.
// No main VFX should disappear in under 1.4 seconds.
export const VFX_TIMING_MS = {
  normalAction: 1400,
  strongAction: 1800,
  nopeCancel: 1600,
  explosion: 2200,
};

export const CARD_FX_TIMING = {
  skip: RETRO_ARCADE_TIMING.standard,
  attack: RETRO_ARCADE_TIMING.cinematic,
  nope: RETRO_ARCADE_TIMING.cinematic,
  shuffle: RETRO_ARCADE_TIMING.cinematic,
  see_the_future_3: RETRO_ARCADE_TIMING.standard,
  favor: RETRO_ARCADE_TIMING.standard,
  defuse: RETRO_ARCADE_TIMING.dramatic,
  exploding_kitten: RETRO_ARCADE_TIMING.dramatic,
  cat_fallback: RETRO_ARCADE_TIMING.quick,
};

const addToLayer = (vfxManager, layerName, displayObject) => {
  const layer = vfxManager?.getLayer?.(layerName);
  if (!layer) return null;
  layer.addChild(displayObject);
  return displayObject;
};

const safeDestroy = (displayObject) => {
  if (displayObject && !displayObject.destroyed) {
    displayObject.destroy({ children: true });
  }
};

const makePixelRect = (width, height, color, alpha = 1) => {
  const rect = new PIXI.Graphics();
  rect.rect(-width / 2, -height / 2, width, height);
  rect.fill({ color, alpha });
  return rect;
};

const makePixelCard = (label, color = 0xffffff) => {
  const card = new PIXI.Container();
  const body = new PIXI.Graphics();
  body.rect(-18, -26, 36, 52);
  body.fill(0x111827);
  body.stroke({ width: 3, color });
  body.rect(-12, -18, 24, 36);
  body.fill({ color, alpha: 0.18 });
  card.addChild(body);

  const text = new PIXI.Text({
    text: label,
    style: {
      fontFamily: 'monospace',
      fontSize: 14,
      fill: color,
      fontWeight: '900',
      letterSpacing: 1,
    },
  });
  text.anchor.set(0.5);
  card.addChild(text);
  return card;
};

const makeCrossSparkle = (size, color, alpha = 1) => {
  const sparkle = new PIXI.Container();
  sparkle.addChild(makePixelRect(size * 3, size, color, alpha));
  sparkle.addChild(makePixelRect(size, size * 3, color, alpha));
  return sparkle;
};

const makeOutlinedText = (text, options = {}) => {
  const {
    color = 0xffffff,
    strokeColor = 0x111827,
    fontSize = 96,
    strokeWidth = 10,
  } = options;
  const label = new PIXI.Text({
    text,
    style: {
      fontFamily: 'monospace',
      fontSize,
      fill: color,
      fontWeight: '900',
      align: 'center',
      stroke: { color: strokeColor, width: strokeWidth },
      dropShadow: {
        color: 0x000000,
        distance: Math.max(3, strokeWidth * 0.45),
        alpha: 0.38,
        blur: 0,
      },
    },
  });
  label.anchor.set(0.5);
  return label;
};

export const PrimitiveEffects = {
  safeDestroy,
  makePixelRect,
  makePixelCard,
  addToLayer,
  isReducedMotion,
  getFxScale,
  RETRO_ARCADE_TIMING,
  CARD_FX_TIMING,

  ScreenShake: (vfxManager, intensity = 10, duration = 0.5) => {
    const stage = vfxManager?.app?.stage;
    const tl = gsap.timeline();
    if (!stage || isReducedMotion()) return tl.to({}, { duration: Math.min(duration, 0.08) });

    const originalPos = { x: stage.x, y: stage.y };
    const step = 0.04;

    tl.to(stage, {
      x: () => originalPos.x + Math.round((Math.random() - 0.5) * intensity * 2),
      y: () => originalPos.y + Math.round((Math.random() - 0.5) * intensity * 2),
      duration: step,
      yoyo: true,
      repeat: Math.max(1, Math.floor(duration / step)),
      ease: 'steps(2)',
    }).to(stage, {
      x: originalPos.x,
      y: originalPos.y,
      duration: 0.06,
      ease: 'steps(2)',
    });

    return tl;
  },

  CameraZoom: (vfxManager, scale = 1.2, duration = 0.5) => {
    const stage = vfxManager?.app?.stage;
    const tl = gsap.timeline();
    if (!stage || isReducedMotion()) return tl;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    tl.to(stage, {
      scaleX: scale,
      scaleY: scale,
      pivotX: centerX,
      pivotY: centerY,
      x: centerX,
      y: centerY,
      duration,
      ease: 'steps(4)',
    });

    return tl;
  },

  CameraReset: (vfxManager, duration = 0.3) => {
    const stage = vfxManager?.app?.stage;
    const tl = gsap.timeline();
    if (!stage) return tl;

    tl.to(stage, {
      scaleX: 1,
      scaleY: 1,
      pivotX: 0,
      pivotY: 0,
      x: 0,
      y: 0,
      duration: isReducedMotion() ? 0.05 : duration,
      ease: 'steps(3)',
    });
    return tl;
  },

  Trajectory: (displayObject, startPos, endPos, duration = 0.5) => {
    const tl = gsap.timeline();
    displayObject.position.set(startPos.x, startPos.y);
    displayObject.alpha = 1;
    displayObject.scale.set(0.45);

    if (isReducedMotion()) {
      return tl.to(displayObject, {
        x: endPos.x,
        y: endPos.y,
        scaleX: 1,
        scaleY: 1,
        duration: Math.min(duration, 0.12),
        ease: 'steps(2)',
      });
    }

    tl.to(displayObject, {
      x: endPos.x,
      duration,
      ease: 'power1.inOut',
    }, 0).to(displayObject, {
      y: endPos.y,
      duration,
      ease: 'back.in(1.1)',
    }, 0).to(displayObject, {
      scaleX: 1,
      scaleY: 1,
      duration: duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: 'steps(3)',
    }, 0);

    return tl;
  },

  ColorFlash: (displayObject, duration = 0.2, color = 0xff0000) => {
    const tl = gsap.timeline();
    const oldTint = displayObject.tint ?? 0xffffff;

    tl.call(() => {
      displayObject.tint = typeof color === 'string' ? Number(color) : color;
    }).to({}, { duration: duration / 2 })
      .call(() => {
        displayObject.tint = oldTint;
      }).to({}, { duration: duration / 2 });

    return tl;
  },

  HitStop: (duration = 0.1) => gsap.timeline().to({}, { duration }),

  createRadialBurst: (vfxManager, position, options = {}) => {
    const {
      color = 0x38bdf8,
      accent = 0xffffff,
      radius = Math.min(window.innerWidth, window.innerHeight) * 0.34,
      rayCount = 18,
      duration = 0.9,
      rotation = -0.1,
      opacity = 0.72,
      layerName = 'EFFECTS_UNDER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const reduced = isReducedMotion();
    const group = new PIXI.Container();
    group.position.set(position.x, position.y);
    group.rotation = rotation;
    group.scale.set(0.2);
    group.alpha = 0;
    layer.addChild(group);

    const rays = reduced ? Math.min(rayCount, 10) : rayCount;
    for (let i = 0; i < rays; i += 1) {
      const angle = (Math.PI * 2 * i) / rays;
      const spread = Math.PI / rays * 0.62;
      const ray = new PIXI.Graphics();
      ray.moveTo(0, 0);
      ray.lineTo(Math.cos(angle - spread) * radius, Math.sin(angle - spread) * radius);
      ray.lineTo(Math.cos(angle + spread) * radius, Math.sin(angle + spread) * radius);
      ray.closePath();
      ray.fill({ color: i % 2 ? accent : color, alpha: i % 2 ? opacity * 0.55 : opacity });
      group.addChild(ray);
    }

    const actualDuration = reduced ? Math.min(duration, 0.65) : duration;
    tl.to(group, {
      alpha: reduced ? opacity * 0.45 : 1,
      scaleX: 1,
      scaleY: 1,
      duration: actualDuration * 0.24,
      ease: 'back.out(1.5)',
    }).to(group, {
      rotation: rotation + (reduced ? 0.02 : 0.16),
      duration: actualDuration * 0.46,
      ease: 'power1.out',
    }, 0).to(group, {
      alpha: 0,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: actualDuration * 0.5,
      ease: 'power2.out',
      onComplete: () => safeDestroy(group),
    }, actualDuration * 0.48);

    return tl;
  },

  createPixelTrail: (vfxManager, start, end, options = {}) => {
    const {
      color = 0x38bdf8,
      accent = 0xffffff,
      count = 26,
      size = 12,
      duration = 0.72,
      spread = 44,
      layerName = 'EFFECTS_OVER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const reduced = isReducedMotion();
    const group = new PIXI.Container();
    layer.addChild(group);
    const particles = reduced ? Math.min(count, 8) : count;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normal = { x: -dy / length, y: dx / length };
    const back = { x: -dx / length, y: -dy / length };

    for (let i = 0; i < particles; i += 1) {
      const progress = i / Math.max(1, particles - 1);
      const jitter = ((i % 5) - 2) * spread * 0.16;
      const pixelSize = size * (0.65 + (i % 4) * 0.14);
      const pixel = makePixelRect(pixelSize, pixelSize, i % 4 === 0 ? accent : color, 0.92);
      pixel.position.set(
        start.x + dx * progress + normal.x * jitter,
        start.y + dy * progress + normal.y * jitter,
      );
      pixel.alpha = 0;
      pixel.scale.set(0.45);
      group.addChild(pixel);

      const delay = reduced ? i * 0.01 : i * 0.018;
      tl.to(pixel, {
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: duration * 0.18,
        ease: 'steps(3)',
      }, delay).to(pixel, {
        x: pixel.x + back.x * (38 + (i % 4) * 16),
        y: pixel.y + back.y * (38 + (i % 4) * 16),
        alpha: 0,
        scaleX: 0.35,
        scaleY: 0.35,
        duration: duration * 0.58,
        ease: 'power2.out',
      }, delay + duration * 0.16);
    }

    tl.call(() => safeDestroy(group));
    return tl;
  },

  createOutlinedIconPop: (vfxManager, position, options = {}) => {
    const {
      text = '!',
      color = 0xffffff,
      strokeColor = 0x111827,
      fontSize = 110,
      duration = 0.62,
      hold = 0.08,
      rotation = 0,
      layerName = 'EFFECTS_OVER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const icon = makeOutlinedText(text, {
      color,
      strokeColor,
      fontSize: fontSize * getFxScale(),
      strokeWidth: Math.max(9, fontSize * 0.1),
    });
    icon.position.set(position.x, position.y);
    icon.rotation = rotation;
    icon.scale.set(0.65);
    icon.alpha = 0;
    layer.addChild(icon);

    const actualDuration = isReducedMotion() ? Math.min(duration, 0.72) : duration;
    tl.to(icon, {
      alpha: 1,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: actualDuration * 0.28,
      ease: 'back.out(1.8)',
    }).to(icon, {
      scaleX: 1,
      scaleY: 1,
      duration: actualDuration * 0.18,
      ease: 'power2.out',
    }).to(icon, { duration: hold }).to(icon, {
      alpha: 0,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: actualDuration * 0.28,
      ease: 'power2.in',
      onComplete: () => safeDestroy(icon),
    });

    return tl;
  },

  createPixelSparkleBurst: (vfxManager, position, options = {}) => {
    const {
      color = 0xffffff,
      accent = 0x38bdf8,
      count = 18,
      distance = 160,
      size = 6,
      duration = 0.8,
      layerName = 'EFFECTS_OVER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const reduced = isReducedMotion();
    const group = new PIXI.Container();
    group.position.set(position.x, position.y);
    layer.addChild(group);
    const particles = reduced ? Math.min(count, 8) : count;

    for (let i = 0; i < particles; i += 1) {
      const angle = (Math.PI * 2 * i) / particles;
      const radius = distance * (0.45 + (i % 5) * 0.12);
      const sparkle = i % 3 === 0
        ? makeCrossSparkle(size, color, 0.9)
        : makePixelRect(size * 1.2, size * 1.2, i % 2 ? accent : color, 0.88);
      sparkle.alpha = 0;
      sparkle.scale.set(0.5);
      group.addChild(sparkle);

      tl.to(sparkle, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: duration * 0.35,
        ease: 'power2.out',
      }, i * 0.012).to(sparkle, {
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: duration * 0.52,
        ease: 'power2.in',
      }, duration * 0.38 + i * 0.012);
    }

    tl.call(() => safeDestroy(group));
    return tl;
  },

  createStampHold: (vfxManager, text, position, options = {}) => {
    const {
      color = 0xff003c,
      strokeColor = 0x111827,
      fontSize = 100,
      duration = 1.0,
      hold = 0.45,
      rotation = -0.12,
      layerName = 'EFFECTS_OVER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const stamp = makeOutlinedText(text, {
      color,
      strokeColor,
      fontSize: fontSize * getFxScale(),
      strokeWidth: Math.max(10, fontSize * 0.11),
    });
    stamp.position.set(position.x, position.y);
    stamp.rotation = rotation;
    stamp.scale.set(0.6);
    stamp.alpha = 0;
    layer.addChild(stamp);

    const actualDuration = isReducedMotion() ? Math.min(duration, 0.95) : duration;
    const actualHold = isReducedMotion() ? Math.min(hold, 0.18) : hold;
    tl.to(stamp, {
      alpha: 1,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: actualDuration * 0.18,
      ease: 'back.out(1.9)',
    }).to(stamp, {
      scaleX: 1,
      scaleY: 1,
      duration: actualDuration * 0.12,
      ease: 'power2.out',
    }).to(stamp, { duration: actualHold }).to(stamp, {
      alpha: 0,
      y: position.y - 24,
      duration: Math.max(0.12, actualDuration * 0.28),
      ease: 'power2.in',
      onComplete: () => safeDestroy(stamp),
    });

    return tl;
  },

  PixelScreenFlash: (vfxManager, color = 0xffffff, duration = 0.22, alpha = 0.26) => {
    const layer = vfxManager?.getLayer?.('SCREEN_EFFECTS');
    const tl = gsap.timeline();
    if (!layer) return tl;

    const flash = new PIXI.Graphics();
    flash.rect(0, 0, window.innerWidth, window.innerHeight);
    flash.fill({ color, alpha });
    flash.alpha = 0;
    layer.addChild(flash);

    tl.to(flash, { alpha: 1, duration: duration * 0.35, ease: 'steps(1)' })
      .to(flash, {
        alpha: 0,
        duration: duration * 0.65,
        ease: 'steps(3)',
        onComplete: () => safeDestroy(flash),
      });

    return tl;
  },

  PixelVignette: (vfxManager, color = 0xff0000, duration = 0.8) => {
    const layer = vfxManager?.getLayer?.('SCREEN_EFFECTS');
    const tl = gsap.timeline();
    if (!layer) return tl;

    const frame = new PIXI.Graphics();
    frame.rect(0, 0, window.innerWidth, window.innerHeight);
    frame.stroke({ width: 42, color, alpha: 0.55, alignment: 1 });
    frame.alpha = 0;
    layer.addChild(frame);

    tl.to(frame, { alpha: 1, duration: 0.08, ease: 'steps(1)' })
      .to(frame, { alpha: 0.25, duration: duration * 0.45, yoyo: true, repeat: 1, ease: 'steps(3)' })
      .to(frame, { alpha: 0, duration: 0.12, onComplete: () => safeDestroy(frame) });

    return tl;
  },

  PixelBurst: (vfxManager, position, options = {}) => {
    const {
      color = 0xffffff,
      count = 18,
      distance = 180,
      size = 10,
      duration = 0.48,
      layerName = 'EFFECTS_OVER',
      shape = 'square',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const group = new PIXI.Container();
    group.position.set(position.x, position.y);
    layer.addChild(group);

    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const length = shape === 'line' ? size * 4 : size;
      const pixel = makePixelRect(length, size, color, 0.95);
      pixel.rotation = angle;
      pixel.alpha = 0;
      group.addChild(pixel);

      tl.to(pixel, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        alpha: 1,
        duration: duration * 0.45,
        ease: 'steps(4)',
      }, 0).to(pixel, {
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: duration * 0.55,
        ease: 'steps(3)',
      }, duration * 0.32);
    }

    tl.call(() => safeDestroy(group));
    return tl;
  },

  PixelRing: (vfxManager, position, options = {}) => {
    const {
      color = 0xffffff,
      radius = 72,
      thickness = 8,
      duration = 0.42,
      alpha = 0.85,
      layerName = 'EFFECTS_OVER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const ring = new PIXI.Graphics();
    ring.circle(0, 0, radius);
    ring.stroke({ width: thickness, color, alpha });
    ring.position.set(position.x, position.y);
    ring.scale.set(0.3);
    ring.alpha = 0;
    layer.addChild(ring);

    tl.to(ring, { alpha: 1, scaleX: 1, scaleY: 1, duration: duration * 0.35, ease: 'steps(3)' })
      .to(ring, {
        alpha: 0,
        scaleX: 1.55,
        scaleY: 1.55,
        duration: duration * 0.65,
        ease: 'steps(4)',
        onComplete: () => safeDestroy(ring),
      });

    return tl;
  },

  PixelSpeedStreaks: (vfxManager, options = {}) => {
    const {
      color = 0x38bdf8,
      accent = 0xffffff,
      count = 18,
      duration = 0.42,
      direction = 1,
      layerName = 'EFFECTS_UNDER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const group = new PIXI.Container();
    layer.addChild(group);

    for (let i = 0; i < count; i += 1) {
      const width = 80 + (i % 4) * 34;
      const height = 6 + (i % 3) * 4;
      const y = (window.innerHeight / (count + 1)) * (i + 1);
      const startX = direction > 0 ? -width - 40 - i * 12 : window.innerWidth + width + i * 12;
      const endX = direction > 0 ? window.innerWidth + width + i * 18 : -width - i * 18;
      const streak = makePixelRect(width, height, i % 5 === 0 ? accent : color, 0.88);
      streak.position.set(startX, Math.round(y / 6) * 6);
      streak.alpha = 0;
      group.addChild(streak);

      tl.to(streak, {
        x: endX,
        alpha: 1,
        duration,
        ease: 'steps(7)',
      }, i * 0.015).to(streak, {
        alpha: 0,
        duration: 0.08,
        ease: 'steps(1)',
      }, duration * 0.72 + i * 0.015);
    }

    tl.call(() => safeDestroy(group));
    return tl;
  },

  PixelStampText: (vfxManager, text, position, options = {}) => {
    const {
      color = 0xff003c,
      strokeColor = 0x111827,
      fontSize = 88,
      duration = 0.72,
      rotation = -0.12,
      layerName = 'EFFECTS_OVER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const stamp = new PIXI.Text({
      text,
      style: {
        fontFamily: 'monospace',
        fontSize,
        fill: color,
        fontWeight: '900',
        stroke: { color: strokeColor, width: 8 },
        dropShadow: {
          color: 0x000000,
          distance: 6,
          alpha: 0.45,
          blur: 0,
        },
      },
    });
    stamp.anchor.set(0.5);
    stamp.position.set(position.x, position.y);
    stamp.rotation = rotation;
    stamp.scale.set(2.8);
    stamp.alpha = 0;
    layer.addChild(stamp);

    tl.to(stamp, { alpha: 1, scaleX: 1, scaleY: 1, duration: 0.1, ease: 'steps(2)' })
      .to(stamp, { scaleX: 1.08, scaleY: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: 'steps(2)' })
      .to(stamp, {
        alpha: 0,
        y: position.y - 24,
        duration: duration - 0.26,
        ease: 'steps(5)',
        onComplete: () => safeDestroy(stamp),
      });

    return tl;
  },

  PixelArrowBurst: (vfxManager, position, options = {}) => {
    const {
      color = 0x38bdf8,
      accent = 0xffffff,
      count = 3,
      duration = 0.54,
      layerName = 'EFFECTS_OVER',
    } = options;
    const layer = vfxManager?.getLayer?.(layerName);
    const tl = gsap.timeline();
    if (!layer) return tl;

    const group = new PIXI.Container();
    group.position.set(position.x, position.y);
    layer.addChild(group);

    for (let i = 0; i < count; i += 1) {
      const arrow = new PIXI.Container();
      const main = makePixelRect(54, 16, i === 1 ? accent : color, 1);
      const top = makePixelRect(28, 16, i === 1 ? accent : color, 1);
      const bottom = makePixelRect(28, 16, i === 1 ? accent : color, 1);
      top.position.set(24, -14);
      bottom.position.set(24, 14);
      top.rotation = 0.75;
      bottom.rotation = -0.75;
      arrow.addChild(main, top, bottom);
      arrow.position.set(-110 - i * 40, (i - 1) * 28);
      arrow.alpha = 0;
      arrow.scale.set(0.8);
      group.addChild(arrow);

      tl.to(arrow, {
        x: 24 + i * 32,
        alpha: 1,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: duration * 0.45,
        ease: 'steps(5)',
      }, i * 0.05).to(arrow, {
        x: 160 + i * 68,
        alpha: 0,
        duration: duration * 0.55,
        ease: 'steps(6)',
      }, duration * 0.35 + i * 0.05);
    }

    tl.call(() => safeDestroy(group));
    return tl;
  },

  VignettePulse: (vfxManager, duration = 1.0, color = 0xff0000) => (
    PrimitiveEffects.PixelVignette(vfxManager, color, duration)
  ),
};
