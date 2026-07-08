const BaseEffect = require('./BaseEffect');
const { shuffleDeck } = require('../../deck'); // assume game/deck.js exports shuffleDeck

class CollectGarbageResponsesEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const responses = payload.responses;
    if (!responses) return { status: 'FAILED' };

    // Collect cards
    Object.entries(responses).forEach(([playerId, cardData]) => {
      const p = state.players.find(player => player.userId === playerId);
      const cardId = typeof cardData === 'string' ? cardData : cardData?.cardId;
      if (p && cardId) {
        const handIdx = p.hand.findIndex(c => c.id === cardId);
        if (handIdx !== -1) {
          const [card] = p.hand.splice(handIdx, 1);
          delete card.marked;
          // Put into deck
          state.deck.push(card);
        }
      }
    });

    // Shuffle entire deck
    // Note: state.deck needs to be shuffled. game/deck.js usually provides this.
    // Let's implement a quick shuffle inline to avoid circular dep if any.
    for (let i = state.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }

    return { status: 'SUCCESS' };
  }
}

module.exports = CollectGarbageResponsesEffect;
