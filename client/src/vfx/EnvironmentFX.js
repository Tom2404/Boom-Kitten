import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { animationManager } from './AnimationManager';
import { soundManager } from './SoundManager';

/**
 * 1. Turn Transition (Chuyển Lượt)
 * Cắt ngang màn hình với Text "LƯỢT CỦA BẠN"
 */
animationManager.register('ENV_TURN_TRANSITION', (event, vfxManager) => {
  const tl = gsap.timeline();
  const layer = vfxManager.getLayer('UI_POPUP');
  
  const isMyTurn = event.metadata?.isMyTurn;
  const textMsg = isMyTurn ? "YOUR TURN" : "ENEMY TURN";
  const color = isMyTurn ? 0x00FF00 : 0xFF0000;

  // Banner nền đen mờ
  const banner = new PIXI.Graphics();
  banner.rect(0, window.innerHeight / 2 - 50, window.innerWidth, 100);
  banner.fill({ color: 0x000000, alpha: 0.8 });
  
  // Text Pixel-like
  const text = new PIXI.Text({
    text: textMsg,
    style: { fontSize: 40, fill: color, fontWeight: 'bold' }
  });
  text.anchor.set(0.5);
  text.position.set(window.innerWidth / 2, window.innerHeight / 2);

  banner.addChild(text);
  layer.addChild(banner);

  // Animation: Trượt từ phải sang trái
  gsap.fromTo(banner.position, 
    { x: window.innerWidth }, 
    { x: 0, duration: 0.3, ease: 'power2.out' }
  );

  tl.add(() => soundManager.play('sfx_turn_start'), 0);
  
  // Giữ 1 giây rồi trượt đi
  tl.to(banner.position, {
    x: -window.innerWidth,
    duration: 0.3,
    ease: 'power2.in',
    delay: 1.0,
    onComplete: () => banner.destroy()
  });

  return tl;
});

/**
 * 2. Danger Mode Vignette (Chớp đỏ khi có quá nhiều lá cần rút hoặc sắp hết bài)
 */
let dangerVignette = null;

animationManager.register('ENV_DANGER_MODE_TOGGLE', (event, vfxManager) => {
  const isActive = event.metadata?.active;
  const layer = vfxManager.getLayer('SCREEN_EFFECTS');

  if (isActive && !dangerVignette) {
    // Bật Danger Mode
    dangerVignette = new PIXI.Graphics();
    // Khung đỏ mờ viền màn hình
    dangerVignette.rect(0, 0, window.innerWidth, window.innerHeight);
    dangerVignette.stroke({ width: 20, color: 0xFF0000, alpha: 0.5 });
    
    layer.addChild(dangerVignette);

    // Chớp nháy liên tục (nhịp tim)
    gsap.to(dangerVignette, {
      alpha: 0.2,
      duration: 0.5,
      yoyo: true,
      repeat: -1, // Vô hạn
      ease: 'sine.inOut'
    });
    
    soundManager.play('sfx_danger_heartbeat');

  } else if (!isActive && dangerVignette) {
    // Tắt Danger Mode
    gsap.killTweensOf(dangerVignette);
    dangerVignette.destroy();
    dangerVignette = null;
  }
  
  // Không cần block (priority LOW)
  return Promise.resolve();
});
