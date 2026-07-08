class GameContext {
  /**
   * Wraps the raw game state object.
   * @param {Object} state - The raw game state from roomManager.
   * @param {Object} effectQueue - The queue for processing effects.
   * @param {Object} eventBus - The bus for dispatching events.
   */
  constructor(state, effectQueue = null, eventBus = null) {
    this.state = state;
    this.effectQueue = effectQueue;
    this.eventBus = eventBus;
  }

  /**
   * Retrieves a player by their ID.
   * @param {string} playerId 
   * @returns {Object|undefined}
   */
  getPlayer(playerId) {
    return this.state.players.find((p) => p.userId === playerId);
  }

  /**
   * Gets the currently active player whose turn it is.
   * @returns {Object|undefined}
   */
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }

  /**
   * Returns whether a player is alive.
   * @param {string} playerId 
   * @returns {boolean}
   */
  isPlayerAlive(playerId) {
    const p = this.getPlayer(playerId);
    return p ? p.alive : false;
  }

  /**
   * Removes a card of a specific type from a player's hand.
   * @param {string} playerId 
   * @param {string} cardType 
   * @returns {Object|null} The removed card, or null if not found.
   */
  removeCardFromHandByType(playerId, cardType) {
    const p = this.getPlayer(playerId);
    if (!p) return null;
    const index = p.hand.findIndex((card) => card.type === cardType);
    if (index < 0) return null;
    const [card] = p.hand.splice(index, 1);
    return card;
  }

  /**
   * Removes a specific card instance by ID from a player's hand.
   * @param {string} playerId 
   * @param {string} cardId 
   * @returns {Object|null}
   */
  removeCardFromHandById(playerId, cardId) {
    const p = this.getPlayer(playerId);
    if (!p) return null;
    const index = p.hand.findIndex((card) => card.id === cardId);
    if (index < 0) return null;
    const [card] = p.hand.splice(index, 1);
    return card;
  }

  /**
   * Draws a card from the deck.
   * @param {boolean} fromBottom 
   * @returns {Object|null}
   */
  drawFromDeck(fromBottom = false) {
    if (this.state.deck.length === 0) return null;
    return fromBottom ? this.state.deck.shift() : this.state.deck.pop();
  }

  /**
   * Re-inserts a card into the deck at a specific position.
   * @param {Object} card 
   * @param {number} position 
   */
  insertIntoDeck(card, position = 0) {
    const safePos = Math.max(0, Math.min(position, this.state.deck.length));
    this.state.deck.splice(safePos, 0, card);
  }

  /**
   * Discards a card to the discard pile.
   * @param {Object} card 
   */
  discard(card) {
    delete card.marked; // cleanup marks
    if (!this.state.discardPile) {
      this.state.discardPile = [];
    }
    this.state.discardPile.push(card);
  }
}

module.exports = GameContext;
