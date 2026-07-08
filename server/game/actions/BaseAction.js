class BaseAction {
  /**
   * Validates if the action can be performed.
   * @param {Object} context - GameContext
   * @param {Object} payload - Action payload
   * @returns {Object} { valid: boolean, error?: string }
   */
  validate(context, payload) {
    throw new Error('validate() must be implemented by subclass');
  }
}

module.exports = BaseAction;
