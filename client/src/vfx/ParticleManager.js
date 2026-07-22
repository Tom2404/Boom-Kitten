import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter';
import { getParticleBudget } from './config/vfxQuality';
import { createGlitterTrailBlueprints } from './config/glitterTrailConfig';

const createCanvasTexture = (size, draw) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  draw(context, size);
  return PIXI.Texture.from(canvas);
};

const createSoftTexture = (size = 32, coreAlpha = 0.94) => createCanvasTexture(size, (context, extent) => {
  const center = extent / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, `rgba(255,255,255,${coreAlpha})`);
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.72)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.22)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, extent, extent);
});

const createGrainTexture = (size = 18, skew = 0) => createCanvasTexture(size, (context, extent) => {
  const center = extent / 2;
  context.translate(center, center);
  context.rotate(skew);
  context.beginPath();
  context.moveTo(-extent * 0.22, -extent * 0.08);
  context.quadraticCurveTo(-extent * 0.12, -extent * 0.28, extent * 0.12, -extent * 0.16);
  context.quadraticCurveTo(extent * 0.3, 0, extent * 0.12, extent * 0.2);
  context.quadraticCurveTo(-extent * 0.12, extent * 0.28, -extent * 0.28, extent * 0.06);
  context.closePath();
  context.fillStyle = 'rgba(255,255,255,0.9)';
  context.fill();
});

const createFleckTexture = (size = 32, thickness = 4) => createCanvasTexture(size, (context, extent) => {
  const center = extent / 2;
  const gradient = context.createLinearGradient(extent * 0.15, center, extent * 0.85, center);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.32, 'rgba(255,255,255,0.66)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.68, 'rgba(255,255,255,0.66)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.beginPath();
  context.roundRect(extent * 0.12, center - thickness / 2, extent * 0.76, thickness, thickness / 2);
  context.fill();
});

const createSparkleTexture = (size = 36) => createCanvasTexture(size, (context, extent) => {
  const center = extent / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.16, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.48, 'rgba(255,255,255,0.18)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, extent, extent);
  context.globalCompositeOperation = 'lighter';
  context.fillStyle = 'rgba(255,255,255,0.94)';
  context.beginPath();
  context.moveTo(center, extent * 0.06);
  context.lineTo(center + extent * 0.08, center - extent * 0.08);
  context.lineTo(extent * 0.94, center);
  context.lineTo(center + extent * 0.08, center + extent * 0.08);
  context.lineTo(center, extent * 0.94);
  context.lineTo(center - extent * 0.08, center + extent * 0.08);
  context.lineTo(extent * 0.06, center);
  context.lineTo(center - extent * 0.08, center - extent * 0.08);
  context.closePath();
  context.fill();
});

class ParticleManager {
  constructor() {
    this.emitters = [];
    this.vfxManager = null;
    this.pixelTexture = null;
    this.glitterTextures = null;
    this.tickerCallback = null;
  }

  init(vfxManager) {
    this.vfxManager = vfxManager;
    this.emitters = []; // Xóa các emitter cũ nếu có
    
    // Tạo texture 1 pixel trắng (để tint màu tùy thích) cho particle pixel art
    const graphics = new PIXI.Graphics();
    graphics.rect(0, 0, 8, 8); // Kích thước hạt vuông 8x8 tạo cảm giác Pixel
    graphics.fill(0xFFFFFF);
    this.pixelTexture = this.vfxManager.app.renderer.generateTexture(graphics);
    graphics.destroy();

    this.glitterTextures = {
      soft: [createSoftTexture(32), createSoftTexture(20, 0.82)],
      grain: [createGrainTexture(18, -0.18), createGrainTexture(14, 0.34)],
      fleck: [createFleckTexture(32, 4), createFleckTexture(24, 3)],
      sparkle: [createSparkleTexture(36)],
    };

    // Bắt đầu vòng lặp update particle
    this.tickerCallback = (ticker) => {
      this.update(ticker.elapsedMS * 0.001); // Update bằng delta time tính theo giây
    };
    this.vfxManager.app.ticker.add(this.tickerCallback);
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

  createGlitterTrail(options = {}) {
    if (!this.vfxManager || !this.glitterTextures) return null;

    const layerName = options.layerName || 'EFFECTS_OVER';
    const container = this.vfxManager.getLayer(layerName);
    if (!container) return null;

    const count = Math.max(3, Number(options.count) || 26);
    const blueprints = createGlitterTrailBlueprints({
      ...options,
      count,
      particleBudget: getParticleBudget(count),
    });
    const trailEmitters = blueprints.map((blueprint) => {
      const textures = blueprint.textureFamily.flatMap((family) => this.glitterTextures[family] || []);
      const emitter = new particles.Emitter(container, this.getGlitterConfig(blueprint, textures));
      emitter.emit = false;
      emitter.fillPool(blueprint.maxParticles);
      this.emitters.push(emitter);
      return emitter;
    });
    let stopped = false;

    return {
      start: (position) => {
        if (stopped) return;
        trailEmitters.forEach((emitter) => {
          emitter.updateOwnerPos(position.x, position.y);
          emitter.resetPositionTracking();
          emitter.emit = true;
        });
      },
      moveTo: (position) => {
        if (stopped) return;
        trailEmitters.forEach((emitter) => emitter.updateOwnerPos(position.x, position.y));
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        trailEmitters.forEach((emitter) => {
          emitter.emit = false;
        });
      },
    };
  }

  getGlitterConfig(blueprint, textures) {
    return {
      lifetime: blueprint.lifetime,
      frequency: blueprint.frequency,
      spawnChance: 1,
      particlesPerWave: 1,
      emitterLifetime: -1,
      maxParticles: blueprint.maxParticles,
      pos: { x: 0, y: 0 },
      addAtBack: blueprint.id === 'dust',
      emit: false,
      behaviors: [
        {
          type: 'alpha',
          config: { alpha: { list: blueprint.alpha, isStepped: false } },
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { value: blueprint.scale.start, time: 0 },
                { value: blueprint.scale.end, time: 1 },
              ],
              isStepped: false,
            },
            minMult: blueprint.scale.minMult,
          },
        },
        {
          type: 'color',
          config: {
            color: {
              list: [
                { value: blueprint.color.start, time: 0 },
                { value: blueprint.color.end, time: 1 },
              ],
              isStepped: false,
            },
          },
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                { value: blueprint.speed.start, time: 0 },
                { value: blueprint.speed.end, time: 1 },
              ],
              isStepped: false,
            },
            minMult: blueprint.speed.minMult,
          },
        },
        {
          type: 'rotation',
          config: { ...blueprint.rotation, accel: 0 },
        },
        {
          type: 'spawnShape',
          config: {
            type: 'torus',
            data: { x: 0, y: 0, radius: blueprint.spawnRadius, innerRadius: 0 },
          },
        },
        {
          type: 'textureRandom',
          config: { textures },
        },
        {
          type: 'blendMode',
          config: { blendMode: blueprint.blendMode },
        },
      ],
    };
  }

  clear() {
    this.emitters.forEach((emitter) => emitter.destroy());
    this.emitters = [];
  }

  destroy() {
    this.clear();
    const app = this.vfxManager?.app;
    if (app && this.tickerCallback) {
      app.ticker.remove(this.tickerCallback);
    }
    this.tickerCallback = null;
    this.pixelTexture?.destroy?.(true);
    this.pixelTexture = null;
    if (this.glitterTextures) {
      Object.values(this.glitterTextures).flat().forEach((texture) => texture.destroy?.(true));
    }
    this.glitterTextures = null;
    this.vfxManager = null;
  }

  getExplosionConfig() {
    return {
      lifetime: { min: 0.2, max: 0.8 },
      frequency: 0.001,
      spawnChance: 1,
      particlesPerWave: getParticleBudget(80),
      emitterLifetime: 0.1,
      maxParticles: getParticleBudget(80),
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
