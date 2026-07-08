const BaseEffect = require('./BaseEffect');
const deckUtils = require('../../deck'); // If we need shuffle, but maybe we just do simple shuffle here.

class CollectPotLuckResponsesEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    // payload contains interaction responses: { p1: cardData, p2: cardData }
    const responses = payload.responses;
    if (!responses) return { status: 'FAILED' };

    const potLuckCards = [];

    // Collect cards from hands in turn order starting from currentPlayer
    const len = state.players.length;
    let idxCur = state.currentPlayerIndex;
    for (let i = 0; i < len; i += 1) {
      const p = state.players[idxCur];
      const cardData = responses[p.userId];
      
      const cardId = typeof cardData === 'string' ? cardData : cardData?.cardId;
      if (cardId) {
        // Remove from hand
        const handIdx = p.hand.findIndex(c => c.id === cardId);
        if (handIdx !== -1) {
          const [card] = p.hand.splice(handIdx, 1);
          delete card.marked;
          potLuckCards.push(card);
        }
      }
      idxCur = (idxCur + 1) % len;
    }

    // Shuffle only the pot luck cards
    for (let i = potLuckCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [potLuckCards[i], potLuckCards[j]] = [potLuckCards[j], potLuckCards[i]];
    }

    // Place on top of deck (end of array)
    state.deck.push(...potLuckCards);

    return { status: 'SUCCESS' };
  }
}

module.exports = CollectPotLuckResponsesEffect;
