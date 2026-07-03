import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PrimitiveEffects } from './PrimitiveEffects';
import { soundManager } from './SoundManager';

const getCenterPos = () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

const createDummyCard = (vfxManager, cardData) => {
  const layer = vfxManager.getLayer('ACTIVE_CARD');
  const cardContainer = new PIXI.Container();

  if (cardData?.imageUrl) {
    const sprite = PIXI.Sprite.from(cardData.imageUrl);
    sprite.anchor.set(0.5);
    sprite.width = 120;
    sprite.height = 180;
    cardContainer.addChild(sprite);
  } else {
    const graphics = new PIXI.Graphics();
    graphics.rect(-60, -90, 120, 180);
    graphics.fill(0xFFFFFF);
    graphics.stroke({ width: 2, color: 0x000000 });
    cardContainer.addChild(graphics);

    const text = new PIXI.Text({
      text: cardData?.type || 'CARD', 
      style: { fontSize: 16, fill: 0x000000, fontWeight: 'bold' }
    });
    text.anchor.set(0.5);
    cardContainer.addChild(text);
  }

  layer.addChild(cardContainer);
  return cardContainer;
};

export const VFXFactory = {
  createAnimation: (vfxManager, cardData, eventMetadata) => {
    const tl = gsap.timeline();
    const type = cardData?.type || '';

    const centerPos = getCenterPos();
    const handPos = { x: window.innerWidth / 2, y: window.innerHeight + 100 };
    const card = createDummyCard(vfxManager, { type, imageUrl: eventMetadata?.imageUrl });

    // Cấu trúc chung: Bay ra giữa
    tl.add(PrimitiveEffects.Trajectory(card, handPos, centerPos, 0.3));

    switch(type) {
      case 'ATTACK_2X':
      case 'TARGET_ATTACK':
      case 'PERSONAL_ATTACK':
        tl.add(PrimitiveEffects.ScreenShake(vfxManager, 15, 0.4));
        tl.add(() => soundManager.play('sfx_attack'), "-=0.4");
        
        // Vết cào
        tl.add(() => {
          let slash;
          try {
            slash = PIXI.Sprite.from('/vfx/vfx_slash.png');
            slash.anchor.set(0.5);
            slash.width = 300;
            slash.height = 300;
          } catch(e) {
            slash = new PIXI.Graphics();
            slash.rect(-50, -50, 100, 100);
            slash.fill(0xFF0000);
          }
          slash.position.copyFrom(centerPos);
          vfxManager.getLayer('EFFECTS_OVER').addChild(slash);
          
          gsap.to(slash, {
            alpha: 0, scale: 2, rotation: 0.5, duration: 0.3, ease: 'power2.out',
            onComplete: () => slash.destroy()
          });
        }, "-=0.4");
        break;

      case 'NOPE':
        tl.add(PrimitiveEffects.HitStop(0.1)); // Đóng băng khung hình tạo lực
        tl.add(() => {
          const stampText = new PIXI.Text({ text: "NOPE!", style: { fontSize: 100, fill: 0xFF0000, fontWeight: 'bold' } });
          stampText.anchor.set(0.5);
          stampText.position.copyFrom(centerPos);
          vfxManager.getLayer('EFFECTS_OVER').addChild(stampText);

          soundManager.play('sfx_nope');
          gsap.fromTo(stampText, 
            { scale: 3, alpha: 0 },
            { scale: 1, alpha: 1, duration: 0.15, ease: 'power2.in' } // Nện cực nhanh
          );
          gsap.to(stampText, { alpha: 0, delay: 0.5, onComplete: () => stampText.destroy() });
        });
        tl.add(PrimitiveEffects.ScreenShake(vfxManager, 20, 0.2), "+=0.15");
        break;

      case 'SHUFFLE':
        tl.add(() => {
          const tornado = new PIXI.Graphics();
          tornado.circle(0, 0, 80);
          tornado.fill({ color: 0x888888, alpha: 0.5 });
          tornado.position.copyFrom(centerPos);
          vfxManager.getLayer('EFFECTS_OVER').addChild(tornado);

          // RadialBlur primitive thay thế cho tween chay
          tl.add(PrimitiveEffects.RadialBlur(tornado, 0.5));
          gsap.to(tornado, { rotation: Math.PI * 4, duration: 0.5 });
          gsap.to(tornado, { alpha: 0, delay: 0.5, onComplete: () => tornado.destroy() });
        });
        tl.add(PrimitiveEffects.CameraZoom(vfxManager, 1.1, 0.3));
        tl.add(PrimitiveEffects.CameraReset(vfxManager, 0.3), "+=0.3");
        break;

      case 'SEE_THE_FUTURE_3X':
      case 'SEE_THE_FUTURE_5X':
      case 'ALTER_THE_FUTURE_3X':
        tl.add(PrimitiveEffects.ColorFlash(card, 0.5, '0x8800FF'));
        tl.add(() => soundManager.play('sfx_swoosh'));
        break;

      case 'FAVOR':
      case 'I_LL_TAKE_THAT':
        tl.to(card, { rotation: 0.2, yoyo: true, repeat: 5, duration: 0.1 });
        break;
        
      case 'SKIP':
      case 'SUPER_SKIP':
      case 'REVERSE':
        // Gió lướt
        tl.add(PrimitiveEffects.CameraZoom(vfxManager, 0.9, 0.2));
        tl.add(PrimitiveEffects.CameraReset(vfxManager, 0.2));
        break;
        
      default:
        // Normal card (Bury, Draw Bottom...)
        tl.add(PrimitiveEffects.ColorFlash(card, 0.2, '0xFFFFFF'));
        break;
    }

    // Kết thúc: Dọn dẹp Dummy Card
    tl.add(() => card.destroy(), "+=0.3");

    return tl;
  },

  createExplodingKitten: (vfxManager, eventMetadata) => {
    const tl = gsap.timeline();
    const bombPos = getCenterPos();
    
    // Vignette cảnh báo
    tl.add(PrimitiveEffects.VignettePulse(vfxManager, 2.0, 0xFF0000));
    
    // Zoom in
    tl.add(PrimitiveEffects.CameraZoom(vfxManager, 1.5, 2.0), 0);
    
    tl.add(() => {
      soundManager.play('sfx_explosion');
      vfxManager.particleManager.emit('explosion', bombPos.x, bombPos.y);
    }, 2.0);

    tl.add(PrimitiveEffects.ScreenShake(vfxManager, 30, 0.5));
    tl.add(PrimitiveEffects.CameraReset(vfxManager, 0.5));

    return tl;
  },

  createDefuse: (vfxManager, eventMetadata) => {
    const tl = gsap.timeline();
    const bombPos = getCenterPos();
    const handPos = { x: window.innerWidth / 2, y: window.innerHeight + 100 };
    
    const defuseCard = createDummyCard(vfxManager, { type: 'DEFUSE', imageUrl: eventMetadata?.imageUrl });

    tl.add(PrimitiveEffects.HitStop(0.1));
    tl.add(PrimitiveEffects.Trajectory(defuseCard, handPos, bombPos, 0.2));
    
    tl.add(PrimitiveEffects.ColorFlash(defuseCard, 0.2, '0x00FF00'));
    
    tl.add(() => {
      let shield;
      try {
        shield = PIXI.Sprite.from('/vfx/vfx_shield.png');
        shield.anchor.set(0.5);
        shield.width = 250;
        shield.height = 250;
      } catch(e) {
        shield = new PIXI.Graphics();
        shield.circle(0, 0, 100);
        shield.fill({ color: 0x00FF00, alpha: 0.3 });
      }
      shield.position.copyFrom(bombPos);
      vfxManager.getLayer('EFFECTS_OVER').addChild(shield);
      
      gsap.fromTo(shield, 
        { scale: 0.5, alpha: 1 },
        { scale: 1.5, alpha: 0, duration: 0.5, ease: 'power2.out', onComplete: () => shield.destroy() }
      );
    }, "-=0.1");

    tl.add(PrimitiveEffects.CameraReset(vfxManager, 0.5));
    tl.add(() => defuseCard.destroy());

    return tl;
  }
};
