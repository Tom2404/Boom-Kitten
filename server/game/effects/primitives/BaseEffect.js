class BaseEffect {
  /**
   * @param {Object} params - The configuration parameters for the effect.
   */
  constructor(params = {}) {
    this.params = params;
  }

  /**
   * Executes the effect on the game context.
   * @param {Object} context - The GameContext instance.
   * @param {Object} payload - Additional payload data from the action.
   * @returns {Object} EffectResult - { status: 'SUCCESS' | 'WAIT_INPUT' | 'FAILED' | 'NO_EFFECT', data?: any }
   */
  execute(context, payload = {}) {
    // Default implementation does nothing
    return { status: 'SUCCESS' };
  }
}

module.exports = BaseEffect;
