import { vfxManager } from './VFXManager';
import { VFXQueue } from './VFXQueue';
import { VFX_PRIORITY, normalizeVFXEvent } from './VFXEventAdapter';

class AnimationManager {
  constructor() {
    this.registry = {};
    this.activeAnimations = new Map();
    this.queue = new VFXQueue((task) => this.executeTask(task));
  }

  register(key, generatorFn) {
    this.registry[key] = generatorFn;
  }

  enqueue(event) {
    const normalizedEvent = normalizeVFXEvent(event);
    this.queue.enqueue(normalizedEvent);
  }

  enqueueBatch(events) {
    const normalizedEvents = (Array.isArray(events) ? events : []).map((event) => normalizeVFXEvent(event));
    this.queue.enqueueBatch(normalizedEvents);
  }

  cancel(animId) {
    this.queue.cancel(animId);

    if (!animId) {
      this.activeAnimations.forEach((entry) => entry.cancel());
      this.activeAnimations.clear();
      vfxManager.clearTransientLayers?.();
      return;
    }

    const active = this.activeAnimations.get(animId);
    if (active) {
      active.cancel();
      this.activeAnimations.delete(animId);
    }
  }

  clear() {
    this.cancel();
    this.queue.clear();
  }

  async executeTask(task) {
    if (task.isBatch) {
      await Promise.all(task.events.map((event) => this.executeEvent(event)));
      return;
    }

    await this.executeEvent(task);
  }

  async executeEvent(event) {
    const { animKey, priority, animId } = event;
    let generator = this.registry[animKey];

    if (!generator) {
      if (animKey?.startsWith('CARD_CAT_')) {
        generator = this.registry.CARD_NORMAL_CAT;
      } else if (animKey?.startsWith('CARD_')) {
        generator = this.registry.CARD_GENERIC;
      }
    }

    if (!generator) {
      console.warn(`[AnimationManager] No animation registered for key: ${animKey}`);
      return;
    }

    const isReady = await vfxManager.whenReady?.();
    if (!isReady) {
      console.warn(`[AnimationManager] VFX manager is not ready for key: ${animKey}`);
      return;
    }

    const run = () => this.runGenerator({ ...event, animId }, generator);

    if (priority === VFX_PRIORITY.LOW) {
      run();
      return;
    }

    await run();
  }

  runGenerator(event, generator) {
    return new Promise((resolve) => {
      let settled = false;
      let result = null;

      const finish = () => {
        if (settled) return;
        settled = true;
        this.activeAnimations.delete(event.animId);
        resolve();
      };

      const cancel = () => {
        if (settled) return;
        try {
          if (result?.kill) {
            result.kill();
          }
        } catch (error) {
          console.warn('[AnimationManager] Failed to kill animation:', error);
        }
        vfxManager.clearTransientLayers?.();
        finish();
      };

      try {
        result = generator(event, vfxManager);
      } catch (error) {
        console.error('[AnimationManager] Error creating animation:', error);
        finish();
        return;
      }

      this.activeAnimations.set(event.animId, { cancel, result });

      if (result && typeof result.then === 'function') {
        result.then(finish).catch((error) => {
          console.error('[AnimationManager] Animation promise failed:', error);
          finish();
        });
        return;
      }

      if (result && result.eventCallback) {
        const previousComplete = result.eventCallback('onComplete');
        const completeParams = result.eventCallback('onCompleteParams');
        result.eventCallback('onComplete', () => {
          if (typeof previousComplete === 'function') {
            previousComplete.apply(result, completeParams || []);
          }
          finish();
        });
        return;
      }

      finish();
    });
  }
}

export const animationManager = new AnimationManager();
