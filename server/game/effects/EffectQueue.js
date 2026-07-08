class EffectQueue {
  constructor() {
    this.queue = [];
  }

  /**
   * Adds an effect to the back of the queue.
   * @param {Object} effect 
   */
  enqueue(effect) {
    this.queue.push(effect);
  }

  /**
   * Adds an effect to the front of the queue (Useful for interrupts like Defuse/Nope).
   * (Future Support marked for Phase 4+)
   * @param {Object} effect 
   */
  enqueueFront(effect) {
    this.queue.unshift(effect);
  }

  /**
   * Peeks the next effect without removing it.
   * @returns {Object|undefined}
   */
  peek() {
    return this.queue[0];
  }

  /**
   * Removes and returns the next effect.
   * @returns {Object|undefined}
   */
  pop() {
    return this.queue.shift();
  }

  /**
   * Returns true if there are effects in the queue.
   * @returns {boolean}
   */
  isNotEmpty() {
    return this.queue.length > 0;
  }

  /**
   * Clears all effects from the queue.
   */
  clear() {
    this.queue = [];
  }
}

module.exports = EffectQueue;
