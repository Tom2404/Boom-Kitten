import { vfxManager } from './VFXManager';

class AnimationManager {
  constructor() {
    this.queue = [];
    this.isRunning = false;
    this.registry = {}; // Chứa các logic animation cụ thể (Phase 4 sẽ dùng nhiều)
  }

  /**
   * Đăng ký một loại animation.
   * @param {string} key - Ví dụ: 'CARD_ATTACK'
   * @param {Function} generatorFn - Hàm tạo ra GSAP timeline hoặc trả về Promise.
   */
  register(key, generatorFn) {
    this.registry[key] = generatorFn;
  }

  /**
   * Thêm một animation vào hàng chờ.
   * @param {Object} event - Payload từ backend (animation_trigger)
   */
  enqueue(event) {
    console.log(`[AnimationManager] Enqueue event:`, event.type, event.animKey);
    this.queue.push(event);
    this.processNext();
  }

  /**
   * Thêm một batch (chạy song song nhiều animation).
   * @param {Array} events 
   */
  enqueueBatch(events) {
    this.queue.push({ isBatch: true, events });
    this.processNext();
  }

  /**
   * Hủy một animation theo animId (Dùng cho Nope).
   */
  cancel(animId) {
    // 1. Nếu đang nằm trong hàng chờ, xóa đi
    this.queue = this.queue.filter(item => {
      if (item.isBatch) {
        item.events = item.events.filter(e => e.animId !== animId);
        return item.events.length > 0;
      }
      return item.animId !== animId;
    });

    // 2. Nếu đang chạy, ta cần có một danh sách active timelines để kill (sẽ thêm vào sau).
  }

  async processNext() {
    if (this.isRunning || this.queue.length === 0) return;

    this.isRunning = true;
    const task = this.queue.shift();

    try {
      if (task.isBatch) {
        await Promise.all(task.events.map(e => this.executeEvent(e)));
      } else {
        await this.executeEvent(task);
      }
    } catch (err) {
      console.error('[AnimationManager] Error executing animation:', err);
    } finally {
      this.isRunning = false;
      this.processNext();
    }
  }

  async executeEvent(event) {
    const { animKey, priority } = event;
    const generator = this.registry[animKey];

    if (!generator) {
      console.warn(`[AnimationManager] No animation registered for key: ${animKey}`);
      return;
    }

    if (priority === 'LOW') {
      // Non-blocking, chạy ngầm không đợi
      generator(event, vfxManager);
      return Promise.resolve();
    }

    // Blocking (HIGH priority)
    return new Promise((resolve) => {
      const result = generator(event, vfxManager);
      
      // Nếu là GSAP Timeline (có then/onComplete), chờ nó xong
      if (result && typeof result.then === 'function') {
        result.then(resolve);
      } else if (result && result.eventCallback) { // GSAP timeline object
        result.eventCallback("onComplete", resolve);
      } else {
        // Fallback nếu generator là hàm đồng bộ
        resolve();
      }
    });
  }
}

export const animationManager = new AnimationManager();
