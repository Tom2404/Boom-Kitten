import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import {
  PrimitiveEffects,
  getFxScale,
  isReducedMotion,
} from './PrimitiveEffects';
import { soundManager } from './SoundManager';
import { VFX_ASSETS } from './config/vfxAssets';

const COLORS = {
  white: 0xffffff,
  cyan: 0x38bdf8,
  red: 0xef233c,
  orange: 0xf97316,
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
  timeline
    .to(sprite, {
      alpha: 1,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: isReducedMotion() ? 0.12 : 0.2,
      ease: 'back.out(1.8)',
    })
    .to(sprite, {
      alpha: 0,
      scaleX: targetScale * 1.2,
      scaleY: targetScale * 1.2,
      duration: 0.34,
      ease: 'power2.in',
    }, '+=0.28')
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
    timeline.call(() => soundManager.play('sfx_explosion'), [], 0);
    return timeline;
  },

  createDrawCard(vfxManager, metadata = {}) {
    const timeline = gsap.timeline();
    const target = getElementCenter(metadata.targetId) || {
      x: window.innerWidth / 2,
      y: window.innerHeight - 120,
    };
    const start = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 40,
    };
    const scale = getFxScale();

    timeline.add(PrimitiveEffects.createPixelTrail(vfxManager, start, target, {
      color: COLORS.cyan,
      accent: COLORS.white,
      count: isReducedMotion() ? 6 : 18,
      size: 7 * scale,
      duration: isReducedMotion() ? 0.12 : 0.34,
      spread: 44 * scale,
    }));
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
