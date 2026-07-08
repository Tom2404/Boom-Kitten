class ActionDispatcher {
  constructor(factory, engine) {
    this.factory = factory;
    this.engine = engine;
    this.actions = new Map();
  }

  registerAction(actionType, actionInstance) {
    this.actions.set(actionType, actionInstance);
  }

  /**
   * Dispatches an action from the client.
   * @param {string} actionType 
   * @param {Object} context - GameContext
   * @param {Object} payload 
   * @returns {Object} { success, error }
   */
  dispatch(actionType, context, payload) {
    const action = this.actions.get(actionType);
    if (!action) {
      return { success: false, error: 'Invalid action type' };
    }

    // 1. Validate the action
    const validation = action.validate(context, payload);
    if (!validation.valid) {
      return { success: false, error: validation.error || validation.reason };
    }

    const finalPayload = validation.payload || payload;

    if (typeof action.execute === 'function') {
      // Actions that skip the queue and execute directly
      action.execute(context, finalPayload);
    } else {
      // 2. Generate effects using Factory or Action itself
      let effects = [];
      if (typeof action.getEffects === 'function') {
        effects = action.getEffects(context, finalPayload);
      } else if (this.factory) {
        effects = this.factory.createEffects(actionType, finalPayload);
      }

      // 3. Enqueue effects
      effects.forEach(effect => context.effectQueue.enqueue({ effect, payload: finalPayload }));

      // 4. Run the engine
      this.engine.processQueue(context);
    }

    // 5. Merge changes back to original payload reference so caller can read results
    Object.assign(payload, finalPayload);

    return { success: true };
  }
}

module.exports = ActionDispatcher;
