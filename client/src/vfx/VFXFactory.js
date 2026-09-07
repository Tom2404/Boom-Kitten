import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import {
  PrimitiveEffects,
  getFxScale,
  isReducedMotion,
} from './PrimitiveEffects';
import { VFX_ASSETS } from './config/vfxAssets';
import { createCardGhost, flyCardTo } from './cardMover.js';
import { CARD_TIMINGS, motionDuration } from './config/vfxTimings.js';
import { soundManager } from './SoundManager.js';

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
    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
    const targetElement = metadata.targetId ? document.getElementById(metadata.targetId) : null;
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
      // This ghost is the deck-to-hand flight only. The face reveal belongs to
      // DrawReveal.jsx — one reveal per draw, or they stack on top of each other.
      const ghost = createCardGhost('deck-pile-element', {
        cardType: metadata.cardType || '',
        skinIndex: metadata.skinIndex || 0,
        faceDown: true,
      });
      const { element } = ghost;
      timeline.eventCallback('onInterrupt', () => element.remove());

      const targetRect = targetElement?.getBoundingClientRect() || {
        left: target.x - deckRect.width / 2,
        top: target.y - deckRect.height / 2,
        width: deckRect.width,
        height: deckRect.height,
      };

      timeline
        .call(() => soundManager.play('sfx_card_whoosh'))
        // 1. anticipation — the card peels off the deck
        .to(element, { y: -18, scale: 1.06, duration: motionDuration(CARD_TIMINGS.anticipation) })
        // 2. deck recoil, in parallel with the lift
        .to(deckElement, {
          scale: 0.96,
          duration: motionDuration(CARD_TIMINGS.deckRecoil),
          yoyo: true,
          repeat: 1,
        }, '<');

      // 3. travel to the hand
      timeline.add(flyCardTo(ghost, targetRect, {
        duration: CARD_TIMINGS.travel,
        scale: 0.86,
        arc: 40,
      }), '>-0.04');

      // 4. settle
      timeline
        .to(element, { scale: 0.78, rotation: -4, duration: motionDuration(CARD_TIMINGS.settle), ease: 'back.out(2)' }, '-=0.1')
        .call(() => soundManager.play('sfx_card_drop'))
        .to(element, { opacity: 0, duration: motionDuration(0.12) })
        .call(() => element.remove());
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
