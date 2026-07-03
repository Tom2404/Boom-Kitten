import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter';

class ParticleManager {
  constructor() {
    this.emitters = [];
    this.vfxManager = null;
    this.pixelTexture = null;
  }

  init(vfxManager) {
    this.vfxManager = vfxManager;
    this.emitters = []; // Xóa các emitter cũ nếu có
    
    // Tạo texture 1 pixel trắng (để tint màu tùy thích) cho particle pixel art
    const graphics = new PIXI.Graphics();
    graphics.rect(0, 0, 8, 8); // Kích thước hạt vuông 8x8 tạo cảm giác Pixel
    graphics.fill(0xFFFFFF);
    this.pixelTexture = this.vfxManager.app.renderer.generateTexture(graphics);

    // Bắt đầu vòng lặp update particle
    this.vfxManager.app.ticker.add((ticker) => {
      this.update(ticker.elapsedMS * 0.001); // Update bằng delta time tính theo giây
    });
  }

  update(deltaSec) {
    // Xóa các emitter đã hoàn thành
    this.emitters = this.emitters.filter(emitter => {
      if (!emitter.emit && emitter.particleCount === 0) {
        emitter.destroy();
        return false;
      }
      emitter.update(deltaSec);
      return true;
    });
  }

  emit(type, position) {
    if (!this.vfxManager || !this.pixelTexture) return;

    let config = null;
    
    if (type === 'PIXEL_EXPLOSION') {
      config = this.getExplosionConfig();
    }

    if (config) {
      const container = this.vfxManager.getLayer('EFFECTS_OVER');
      const emitter = new particles.Emitter(container, config);
      
      // Update spawn pos
      emitter.updateSpawnPos(position.x, position.y);
      emitter.playOnceAndDestroy(() => {
        // Tự động xóa khỏi màn hình khi xong
      });
      
      this.emitters.push(emitter);
    }
  }

  getExplosionConfig() {
    return {
      lifetime: { min: 0.2, max: 0.8 },
      frequency: 0.001,
      spawnChance: 1,
      particlesPerWave: 100,
      emitterLifetime: 0.1,
      maxParticles: 200,
      pos: { x: 0, y: 0 },
      addAtBack: false,
      behaviors: [
        {
          type: 'alpha',
          config: { alpha: { list: [{ value: 1, time: 0 }, { value: 0, time: 1 }], isStepped: false } }
        },
        {
          type: 'scale',
          config: { scale: { list: [{ value: 2, time: 0 }, { value: 0.5, time: 1 }], isStepped: false } }
        },
        {
          type: 'color',
          config: { color: { list: [{ value: "ffaa00", time: 0 }, { value: "ff0000", time: 1 }], isStepped: false } }
        },
        {
          type: 'moveSpeed',
          config: { speed: { list: [{ value: 800, time: 0 }, { value: 50, time: 1 }], isStepped: false } }
        },
        {
          type: 'moveAcceleration',
          config: { x: 0, y: 2000, minStart: 2000, maxStart: 2000 } // Rớt xuống tạo trọng lực
        },
        {
          type: 'spawnPoint',
          config: {} // Điểm phát là vị trí chuột/bom
        },
        {
          type: 'textureSingle',
          config: { texture: this.pixelTexture }
        }
      ]
    };
  }
}

export const particleManager = new ParticleManager();
