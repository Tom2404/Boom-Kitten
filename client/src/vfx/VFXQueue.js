import { VFX_PRIORITY } from './VFXEventAdapter';

export class VFXQueue {
  constructor(worker) {
    this.worker = worker;
    this.queue = [];
    this.isRunning = false;
  }

  enqueue(task) {
    if (!task) return;

    if (task.priority === VFX_PRIORITY.LOW) {
      this.runLowPriority(task);
      return;
    }

    if (task.priority === VFX_PRIORITY.INTERRUPT) {
      this.queue.unshift(task);
    } else {
      this.queue.push(task);
    }

    this.processNext();
  }

  enqueueBatch(events) {
    const normalizedEvents = Array.isArray(events) ? events.filter(Boolean) : [];
    if (normalizedEvents.length === 0) return;

    const hasBlockingEvent = normalizedEvents.some((event) => event.priority !== VFX_PRIORITY.LOW);
    const task = { isBatch: true, events: normalizedEvents, priority: hasBlockingEvent ? VFX_PRIORITY.HIGH : VFX_PRIORITY.LOW };
    this.enqueue(task);
  }

  cancel(animId) {
    if (!animId) {
      this.queue = [];
      return;
    }

    this.queue = this.queue
      .map((item) => {
        if (!item.isBatch) return item;
        return {
          ...item,
          events: item.events.filter((event) => event.animId !== animId),
        };
      })
      .filter((item) => {
        if (item.isBatch) return item.events.length > 0;
        return item.animId !== animId;
      });
  }

  clear() {
    this.queue = [];
    this.isRunning = false;
  }

  async runLowPriority(task) {
    try {
      await this.worker(task);
    } catch (error) {
      console.error('[VFXQueue] Low priority animation failed:', error);
    }
  }

  async processNext() {
    if (this.isRunning || this.queue.length === 0) return;

    this.isRunning = true;
    const task = this.queue.shift();

    try {
      await this.worker(task);
    } catch (error) {
      console.error('[VFXQueue] Animation failed:', error);
    } finally {
      this.isRunning = false;
      this.processNext();
    }
  }
}
