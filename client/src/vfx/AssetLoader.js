import * as PIXI from 'pixi.js';
import { REQUIRED_VFX_ASSET_URLS } from './config/vfxAssets';

/**
 * AssetLoader
 * - Chỉ tải trước các texture mà hiệu ứng Pixi thực sự sử dụng
 * - Hiển thị màn hình Loading trong lúc tải
 */
export class AssetLoader {
  constructor(vfxManager) {
    this.vfxManager = vfxManager;
    this.loadingContainer = new PIXI.Container();
    this.progressBar = new PIXI.Graphics();
    this.progressText = new PIXI.Text({ text: 'Loading 0%', style: { fill: 0xFFFFFF, fontSize: 24 } });
  }

  async loadAll(showUI = false) {
    if (showUI) {
      this.showLoadingScreen();
    }

    await PIXI.Assets.load(REQUIRED_VFX_ASSET_URLS, (progress) => {
      if (showUI) {
        this.updateProgress(progress);
      }
    });

    if (showUI) {
      this.hideLoadingScreen();
    }
    console.log('[VFX] Assets loaded successfully.');
  }

  showLoadingScreen() {
    const layer = this.vfxManager.getLayer('UI_POPUP');
    if (!layer) return;

    // Nền tối
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.loadingContainer.addChild(bg);

    // Thanh tiến trình
    this.progressBar.position.set(window.innerWidth / 2 - 150, window.innerHeight / 2);
    this.loadingContainer.addChild(this.progressBar);

    // Chữ progress
    this.progressText.anchor.set(0.5);
    this.progressText.position.set(window.innerWidth / 2, window.innerHeight / 2 - 40);
    this.loadingContainer.addChild(this.progressText);

    layer.addChild(this.loadingContainer);
    this.updateProgress(0);
  }

  updateProgress(progress) {
    this.progressText.text = `Loading Assets... ${Math.floor(progress * 100)}%`;
    
    this.progressBar.clear();
    // Viền
    this.progressBar.stroke({ width: 2, color: 0xFFFFFF });
    this.progressBar.rect(0, 0, 300, 20);
    // Cốt
    this.progressBar.fill(0x00FF00);
    this.progressBar.rect(2, 2, 296 * progress, 16);
  }

  hideLoadingScreen() {
    this.loadingContainer.destroy({ children: true });
  }
}
