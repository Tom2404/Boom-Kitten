import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import {
  PrimitiveEffects,
  getFxScale,
  isReducedMotion,
} from './PrimitiveEffects';
import { VFX_ASSETS } from './config/vfxAssets';

const COLORS = {
  white: 0xffffff,
  cyan: 0x38bdf8,
  red: 0xef233c,
  orange: 0xf97316,
  green: 0x22c55e,
};

const getCenter = () => ({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
});

const getElementCenter = (id) => {
  if (!id || typeof document === 'undefined') return null;
  const element = document.getElementById(id);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

const createExplosionSprite = (vfxManager, position) => {
  const layer = vfxManager.getLayer('EFFECTS_OVER');
  const timeline = gsap.timeline();
  if (!layer) return timeline;

  const sprite = PIXI.Sprite.from(VFX_ASSETS.explosionSheet);
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.68;
  sprite.anchor.set(0.5);
  sprite.position.set(position.x, position.y);
  sprite.width = size;
  sprite.height = size;
  sprite.alpha = 0;
  sprite.scale.set(sprite.scale.x * 0.22, sprite.scale.y * 0.22);
  layer.addChild(sprite);

  const targetScale = sprite.scale.x / 0.22;
  const enterDuration = isReducedMotion() ? 0.12 : 0.2;
  timeline
    .to(sprite, {
      alpha: 1,
      duration: enterDuration,
      ease: 'back.out(1.8)',
    }, 0)
    .to(sprite.scale, {
      x: targetScale,
      y: targetScale,
      duration: enterDuration,
      ease: 'back.out(1.8)',
    }, 0)
    .to(sprite, {
      alpha: 0,
      duration: 0.34,
      ease: 'power2.in',
    }, enterDuration + 0.28)
    .to(sprite.scale, {
      x: targetScale * 1.2,
      y: targetScale * 1.2,
      duration: 0.34,
      ease: 'power2.in',
    }, enterDuration + 0.28)
    .call(() => PrimitiveEffects.safeDestroy(sprite));

  return timeline;
};

export const VFXFactory = {
  createExplodingKitten(vfxManager) {
    const timeline = gsap.timeline();
    const center = getCenter();
    const scale = getFxScale();

    timeline.add(PrimitiveEffects.PixelVignette(
      vfxManager,
      COLORS.red,
      isReducedMotion() ? 0.32 : 0.82,
    ));
    timeline.add(
      PrimitiveEffects.PixelScreenFlash(vfxManager, COLORS.orange, 0.16, 0.2),
      '-=0.64',
    );
    timeline.add(createExplosionSprite(vfxManager, center), '-=0.6');
    timeline.add(PrimitiveEffects.createStampHold(vfxManager, 'BOOM!', center, {
      color: COLORS.red,
      fontSize: 112,
      duration: 1.18,
      hold: 0.6,
      rotation: 0,
    }), '-=0.48');
    timeline.add(PrimitiveEffects.PixelBurst(vfxManager, center, {
      color: COLORS.orange,
      count: isReducedMotion() ? 18 : 46,
      distance: (isReducedMotion() ? 130 : 330) * scale,
      size: 15 * scale,
      duration: 0.82,
      shape: 'square',
    }), '-=0.64');
    timeline.add(PrimitiveEffects.ScreenShake(
      vfxManager,
      isReducedMotion() ? 0 : 22,
      0.26,
    ), '-=0.72');
    return timeline;
  },

  createDefuse(vfxManager) {
    const timeline = gsap.timeline();
    const center = getCenter();
    const scale = getFxScale();
    timeline.add(PrimitiveEffects.PixelRing(vfxManager, center, {
      color: COLORS.green,
      radius: 92 * scale,
      thickness: 8 * scale,
      duration: 0.42,
      alpha: 0.9,
    }));
    timeline.add(PrimitiveEffects.PixelBurst(vfxManager, center, {
      color: COLORS.green,
      count: isReducedMotion() ? 8 : 20,
      distance: (isReducedMotion() ? 60 : 150) * scale,
      size: 9 * scale,
      duration: 0.48,
      shape: 'square',
    }), '-=0.3');
    return timeline;
  },

  createDrawCard(vfxManager, metadata = {}) {
    const timeline = gsap.timeline();
    const target = getElementCenter(metadata.targetId) || {
      x: window.innerWidth / 2,
      y: window.innerHeight - 120,
    };
    const deckElement = document.getElementById('deck-pile-element');
    const deckRect = deckElement?.getBoundingClientRect();
    const start = deckRect ? {
      x: deckRect.left + deckRect.width / 2,
      y: deckRect.top + deckRect.height / 2,
    } : getCenter();
    const scale = getFxScale();

    if (deckElement && deckRect) {
      const cardBack = deckElement.cloneNode(true);
      cardBack.removeAttribute('id');
      cardBack.setAttribute('aria-hidden', 'true');
      cardBack.style.cssText += `
        position: fixed;
        left: ${deckRect.left}px;
        top: ${deckRect.top}px;
        width: ${deckRect.width}px;
        height: ${deckRect.height}px;
        margin: 0;
        pointer-events: none;
        z-index: 9998;
        transform-origin: center;
      `;
      document.body.appendChild(cardBack);
      timeline.eventCallback('onInterrupt', () => cardBack.remove());

      const destinationX = target.x - start.x;
      const destinationY = target.y - start.y;
      if (isReducedMotion()) {
        gsap.set(cardBack, { x: destinationX, y: destinationY, scale: 0.92, opacity: 0 });
        timeline.to(cardBack, { opacity: 0.85, scale: 1, duration: 0.12 }, 0);
      } else {
        timeline.to(cardBack, {
          x: destinationX,
          y: destinationY,
          scale: 0.82,
          rotation: 4,
          duration: 0.3,
          ease: 'power2.out',
        }, 0);
      }
      timeline.to(cardBack, { opacity: 0, scale: 0.72, duration: 0.12 }, 0.32);
      timeline.call(() => cardBack.remove(), [], 0.45);
    }

    timeline.add(PrimitiveEffects.createPixelTrail(vfxManager, start, target, {
      color: COLORS.cyan,
      accent: COLORS.white,
      count: isReducedMotion() ? 6 : 18,
      size: 7 * scale,
      duration: isReducedMotion() ? 0.12 : 0.34,
      spread: 44 * scale,
    }), 0);
    timeline.add(PrimitiveEffects.PixelRing(vfxManager, target, {
      color: COLORS.cyan,
      radius: 52 * scale,
      thickness: 7 * scale,
      duration: 0.3,
      alpha: 0.85,
    }), '-=0.16');
    return timeline;
  },
};
