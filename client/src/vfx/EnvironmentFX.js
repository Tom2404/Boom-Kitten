import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { animationManager } from './AnimationManager';
import { soundManager } from './SoundManager';
import { PrimitiveEffects } from './PrimitiveEffects';

animationManager.register('ENV_TURN_TRANSITION', (event, vfxManager) => {
  const tl = gsap.timeline();
  const layer = vfxManager.getLayer('UI_POPUP');
  if (!layer) return tl;

  const isMyTurn = event.metadata?.isMyTurn;
  const textMsg = event.metadata?.label || (isMyTurn ? 'YOUR TURN' : 'ENEMY TURN');
  const color = isMyTurn ? 0x22c55e : 0xef4444;

  const banner = new PIXI.Container();
  const bg = new PIXI.Graphics();
  bg.rect(0, window.innerHeight / 2 - 50, window.innerWidth, 100);
  bg.fill({ color: 0x000000, alpha: 0.8 });

  const text = new PIXI.Text({
    text: textMsg,
    style: {
      fontFamily: 'monospace',
      fontSize: 40,
      fill: color,
      fontWeight: '900',
      stroke: { color: 0x111827, width: 5 },
    },
  });
  text.anchor.set(0.5);
  text.position.set(window.innerWidth / 2, window.innerHeight / 2);

  banner.addChild(bg, text);
  layer.addChild(banner);

  tl.addLabel('anticipation', 0);
  tl.addLabel('impact', 0.3);
  tl.addLabel('afterglow', 1.0);
  tl.addLabel('cleanup', 1.3);
  tl.set(banner.position, { x: window.innerWidth }, 'anticipation');
  tl.to(banner.position, { x: 0, duration: 0.3, ease: 'power2.out' }, 'anticipation');
  tl.call(() => soundManager.play('sfx_turn'), null, 'impact');
  tl.to(banner.position, { x: -window.innerWidth, duration: 0.3, ease: 'power2.in' }, 'afterglow');
  tl.call(() => PrimitiveEffects.safeDestroy(banner), null, 'cleanup');

  return tl;
});

let dangerVignette = null;

animationManager.register('ENV_DANGER_MODE_TOGGLE', (event, vfxManager) => {
  const isActive = event.metadata?.active;
  const layer = vfxManager.getLayer('SCREEN_EFFECTS');
  if (!layer) return Promise.resolve();

  if (isActive && !dangerVignette) {
    dangerVignette = new PIXI.Graphics();
    dangerVignette.rect(0, 0, window.innerWidth, window.innerHeight);
    dangerVignette.stroke({ width: 20, color: 0xef4444, alpha: 0.5 });
    layer.addChild(dangerVignette);

    gsap.to(dangerVignette, {
      alpha: 0.2,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });

    soundManager.play('sfx_danger_heartbeat');
  } else if (!isActive && dangerVignette) {
    gsap.killTweensOf(dangerVignette);
    PrimitiveEffects.safeDestroy(dangerVignette);
    dangerVignette = null;
  }

  return Promise.resolve();
});

animationManager.register('ENV_SCREEN_SHAKE', (event, vfxManager) => {
  const intensity = event.metadata?.intensity || 10;
  const duration = event.metadata?.duration || 0.3;
  return PrimitiveEffects.ScreenShake(vfxManager, intensity, duration);
});
