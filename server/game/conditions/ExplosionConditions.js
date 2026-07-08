const BaseCondition = require('./BaseCondition');

class IsImplodingFaceUpCondition extends BaseCondition {
  evaluate(context) {
    const isFaceUp = context.drawnCard.type === 'imploding_kitten' && context.drawnCard.faceUp;
    return { matched: isFaceUp };
  }
}

class IsImplodingFaceDownCondition extends BaseCondition {
  evaluate(context) {
    const isFaceDown = context.drawnCard.type === 'imploding_kitten' && !context.drawnCard.faceUp;
    return { matched: isFaceDown };
  }
}

class HasStreakingKittenCondition extends BaseCondition {
  evaluate(context) {
    // Only check if it's an exploding kitten. Imploding or Devilcat don't trigger Streaking
    if (context.drawnCard.type !== 'exploding_kitten') {
      return { matched: false };
    }

    const player = context.gameState.players.find(p => p.userId === context.playerId);
    if (!player) return { matched: false };

    const streakingCount = player.hand.filter((c) => c.type === 'streaking_kitten').length;
    const explodingCount = player.hand.filter((c) => c.type === 'exploding_kitten').length;
    
    // The player is drawing a new bomb, so the bomb count after taking this card would be explodingCount + 1.
    // If streakingCount >= (explodingCount + 1), then they can hold it.
    // Equivalent: explodingCount < streakingCount.
    return { matched: explodingCount < streakingCount };
  }
}

class HasDefuseCardCondition extends BaseCondition {
  evaluate(context) {
    const player = context.gameState.players.find(p => p.userId === context.playerId);
    if (!player) return { matched: false };

    const defuseCard = player.hand.find((c) => c.type === 'defuse');
    if (defuseCard) {
      return { matched: true, data: { defuseCard } };
    }
    return { matched: false };
  }
}

class HasZombieKittenCondition extends BaseCondition {
  evaluate(context) {
    const player = context.gameState.players.find(p => p.userId === context.playerId);
    if (!player) return { matched: false };

    const zombieCard = player.hand.find((c) => c.type === 'zombie_kitten');
    if (zombieCard) {
      return { matched: true, data: { defuseCard: zombieCard } };
    }
    return { matched: false };
  }
}

class AlwaysTrueCondition extends BaseCondition {
  evaluate() {
    return { matched: true };
  }
}

module.exports = {
  IsImplodingFaceUpCondition,
  IsImplodingFaceDownCondition,
  HasStreakingKittenCondition,
  HasDefuseCardCondition,
  HasZombieKittenCondition,
  AlwaysTrueCondition
};
