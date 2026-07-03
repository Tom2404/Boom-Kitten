import * as PIXI from 'pixi.js';
import { particleManager } from './ParticleManager';
import { AssetLoader } from './AssetLoader';

class VFXManager {
  constructor() {
    this.app = null;
    this.layers = {};
    this.isInitialized = false;
    this.isInitializing = false;
    this.assetLoader = null;
  }

  /**
   * Khởi tạo Pixi Application gắn vào Canvas Element.
   * @param {HTMLCanvasElement} canvasView 
   */
  init(canvasView) {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    this.app = new PIXI.Application();
    this.assetLoader = new AssetLoader(this);
    
    // PixiJS v8 standard initialization
    this.setupApp(canvasView, this.app);
  }

  async setupApp(canvasView, currentApp) {
    try {
      await currentApp.init({
        canvas: canvasView,
        resizeTo: window,
        backgroundAlpha: 0, // Đảm bảo nền trong suốt để thấy React Layer bên dưới
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (this.app !== currentApp) return; // Bị destroy hoặc thay thế giữa chừng

      this.setupLayers();
      particleManager.init(this); // Khởi tạo Particle Engine
      
      // Tải assets trước khi báo ready
      if (this.assetLoader) {
        await this.assetLoader.loadAll();
      }

      if (this.app !== currentApp) return; // Bị destroy hoặc thay thế giữa chừng lúc đang load asset

      this.isInitialized = true;
      console.log('[VFXManager] PixiJS Initialized.');
    } catch (error) {
      console.error('[VFXManager] Init Error:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  setupLayers() {
    // Định nghĩa các Layer theo chuẩn TDD
    const layerNames = [
      'BACKGROUND',
      'ENVIRONMENT',
      'BOARD',
      'EFFECTS_UNDER',
      'ACTIVE_CARD',
      'EFFECTS_OVER',
      'SCREEN_EFFECTS',
      'UI_POPUP',
      'DEBUG'
    ];

    layerNames.forEach((name, index) => {
      const layer = new PIXI.Container();
      layer.label = name;
      layer.zIndex = index; // Để sort dễ dàng nếu cần
      this.layers[name] = layer;
      this.app.stage.addChild(layer);
    });

    // Ép root container tự động sắp xếp theo zIndex
    this.app.stage.sortableChildren = true;
  }

  getLayer(name) {
    return this.layers[name];
  }

  destroy() {
    if (this.app) {
      try {
        this.app.destroy(false, { children: true });
      } catch (e) {
        console.warn('[VFXManager] Destroy Error:', e);
      }
      this.app = null;
      this.layers = {};
      this.assetLoader = null;
    }
    this.isInitialized = false;
    this.isInitializing = false;
  }
}

export const vfxManager = new VFXManager();
