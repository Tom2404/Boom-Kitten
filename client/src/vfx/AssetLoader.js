import * as PIXI from 'pixi.js';

/**
 * AssetLoader
 * - Dùng import.meta.glob để gom toàn bộ hình ảnh trong assets/cards
 * - Tải ngầm lên VRAM
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

    // 1. Lấy toàn bộ file ảnh từ src/assets/cards
    // Lưu ý: import.meta.glob tự động resolve đường dẫn URL sau khi build
    const modules = import.meta.glob('../assets/cards/**/*.{png,jpg,jpeg}', { eager: false, query: '?url', import: 'default' });
    
    // Tạm gom thêm 2 hình VFX đã tạo vào queue
    const urls = [
      '/vfx/vfx_slash.png',
      '/vfx/vfx_shield.png'
    ];

    for (const path in modules) {
      const url = await modules[path]();
      urls.push(url);
    }

    // 2. Thêm vào Assets manager của PIXI
    PIXI.Assets.addBundle('game_assets', urls.map((url, i) => ({ alias: `asset_${i}`, src: url })));

    // 3. Tải và cập nhật thanh tiến trình
    await PIXI.Assets.loadBundle('game_assets', (progress) => {
      if (showUI) {
        this.updateProgress(progress);
      }
    });

    // 4. Hoàn tất
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
