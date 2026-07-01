class BaseCondition {
  /**
   * Evaluates the condition against the current context.
   * @param {Object} context - The ExplosionContext (gameState, playerId, drawnCard, etc).
   * @returns {Object} A MatchResult object: { matched: boolean, data?: any }
   */
  evaluate(context) {
    return { matched: false };
  }
}

module.exports = BaseCondition;
