const BaseEffect = require('./BaseEffect');

class ApplyAlterFutureResponseEffect extends BaseEffect {
  execute(context, payload = {}) {
    const state = context.state;
    const ownerId = payload.owner;
    const count = payload.metadata?.count || 3;
    const response = payload.responses?.[ownerId];
    const rearrangedCards = Array.isArray(response) ? response : response?.rearrangedCards;

    if (!Array.isArray(rearrangedCards) || rearrangedCards.length === 0) {
      return { status: 'NO_EFFECT' };
    }

    const topCards = state.deck.splice(Math.max(0, state.deck.length - count), count);
    const topIds = new Set(topCards.map((card) => card.id));
    const safeCards = rearrangedCards
      .filter((card) => card && topIds.has(card.id))
      .map((card) => {
        const original = topCards.find((topCard) => topCard.id === card.id);
        return original || card;
      });

    if (safeCards.length !== topCards.length) {
      state.deck.push(...topCards);
      return { status: 'FAILED', error: 'Invalid alter future card order' };
    }

    state.deck.push(...safeCards.reverse());
    return { status: 'SUCCESS' };
  }
}

module.exports = ApplyAlterFutureResponseEffect;
