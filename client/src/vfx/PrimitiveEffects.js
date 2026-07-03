import { gsap } from 'gsap';

export const PrimitiveEffects = {
  /**
   * Screen Shake: Rung lắc root container của Pixi.
   * @param {Object} vfxManager 
   * @param {number} intensity - Độ mạnh của chấn động (pixels)
   * @param {number} duration - Thời gian rung (seconds)
   */
  ScreenShake: (vfxManager, intensity = 10, duration = 0.5) => {
    const stage = vfxManager.app.stage;
    
    // Lưu vị trí gốc (nên luôn là 0,0)
    const originalPos = { x: stage.x, y: stage.y };

    // GSAP timeline
    const tl = gsap.timeline();
    
    tl.to(stage, {
      x: () => originalPos.x + (Math.random() - 0.5) * intensity * 2,
      y: () => originalPos.y + (Math.random() - 0.5) * intensity * 2,
      duration: 0.05,
      yoyo: true,
      repeat: Math.floor(duration / 0.05),
      ease: "rough({ template: none.out, strength: 1, points: 20, taper: 'out', randomize: true, clamp: false })"
    }).to(stage, {
      x: originalPos.x,
      y: originalPos.y,
      duration: 0.1,
      ease: 'power2.out'
    });

    return tl;
  },

  /**
   * Camera Zoom: Phóng to hoặc thu nhỏ màn hình.
   */
  CameraZoom: (vfxManager, scale = 1.2, duration = 0.5) => {
    const stage = vfxManager.app.stage;
    const tl = gsap.timeline();
    
    // Pivot ra giữa màn hình để zoom từ tâm
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
      ease: 'power2.out'
    });

    return tl;
  },

  /**
   * Reset Camera: Trả root container về ban đầu.
   */
  CameraReset: (vfxManager, duration = 0.3) => {
    const stage = vfxManager.app.stage;
    const tl = gsap.timeline();
    tl.to(stage, {
      scaleX: 1,
      scaleY: 1,
      pivotX: 0,
      pivotY: 0,
      x: 0,
      y: 0,
      duration,
      ease: 'power2.inOut'
    });
    return tl;
  },

  /**
   * Trajectory: Di chuyển một vật thể từ điểm A đến điểm B theo đường cong Parabol.
   */
  Trajectory: (displayObject, startPos, endPos, duration = 0.5) => {
    const tl = gsap.timeline();
    
    // Khởi tạo vị trí ban đầu
    displayObject.position.set(startPos.x, startPos.y);
    displayObject.alpha = 1;
    displayObject.scale.set(0.5); // Lúc mới bay ra nhỏ

    // Đường cong parabol bằng cách tách ease X và Y
    tl.to(displayObject, {
      x: endPos.x,
      duration,
      ease: "power1.inOut"
    }, 0).to(displayObject, {
      y: endPos.y,
      duration,
      ease: "back.in(1.2)" // Tạo cảm giác ném vòng cung
    }, 0).to(displayObject, {
      scaleX: 1,
      scaleY: 1,
      duration: duration * 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut"
    }, 0);

    return tl;
  },

  /**
   * ColorFlash: Chớp màu lên vật thể (Dùng ColorMatrixFilter của Pixi).
   */
  ColorFlash: (displayObject, duration = 0.2, color = '0xFF0000') => {
    const tl = gsap.timeline();
    const oldTint = displayObject.tint || 0xFFFFFF;
    
    tl.to(displayObject, {
      pixi: { tint: color },
      duration: duration / 2,
      yoyo: true,
      repeat: 1,
      onComplete: () => { displayObject.tint = oldTint; }
    });

    return tl;
  },

  /**
   * HitStop: Đóng băng khung hình tạm thời (thực tế chỉ là 1 khoảng delay không làm gì)
   */
  HitStop: (duration = 0.1) => {
    return gsap.timeline().to({}, { duration });
  },

  /**
   * RadialBlur: Mô phỏng lốc xoáy hoặc tốc độ cao
   */
  RadialBlur: (displayObject, duration = 0.5) => {
    const tl = gsap.timeline();
    // Blur filter tạm thời chưa implement shader, ta dùng scale + alpha yoyo cường độ cao
    tl.to(displayObject, {
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.8,
      duration: 0.05,
      yoyo: true,
      repeat: Math.floor(duration / 0.05)
    });
    return tl;
  },

  /**
   * VignettePulse: Chớp viền đỏ báo động (Sử dụng Graphics che phủ màn hình)
   */
  VignettePulse: (vfxManager, duration = 1.0, color = 0xFF0000) => {
    const layer = vfxManager.getLayer('SCREEN_EFFECTS');
    const tl = gsap.timeline();
    
    const vignette = new PIXI.Graphics();
    // Tạo gradient mờ ảo (ở đây giả lập bằng frame bán trong suốt chừa phần giữa)
    vignette.rect(0, 0, window.innerWidth, window.innerHeight);
    vignette.stroke({ width: 50, color, alpha: 0.5, alignment: 1 });
    vignette.alpha = 0;
    layer.addChild(vignette);

    tl.to(vignette, { alpha: 1, duration: 0.2, yoyo: true, repeat: Math.floor(duration / 0.4) })
      .to(vignette, { alpha: 0, duration: 0.2, onComplete: () => vignette.destroy() });
      
    return tl;
  }
};
