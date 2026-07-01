class EffectEngine {
  /**
   * Processes all pending effects in the queue.
   * @param {Object} context - GameContext.
   */
  static processQueue(context) {
    const queue = context.effectQueue;
    let lastResult = { status: 'SUCCESS' };
    
    while (queue.isNotEmpty()) {
      const effectData = queue.pop();
      const payload = effectData.payload || {};

      try {
        const result = effectData.effect.execute(context, payload);
        lastResult = result || { status: 'SUCCESS' };

        if (lastResult.status === 'WAIT_INPUT') {
          break;
        }

        if (lastResult.status === 'FAILED' || lastResult.status === 'INTERRUPTED') {
          queue.clear();
          break;
        }
      } catch (error) {
        console.error('Error executing effect:', error);
        lastResult = { status: 'FAILED', error: error.message };
        queue.clear();
        break;
      }
    }
    
    return lastResult;
  }
}

module.exports = EffectEngine;
