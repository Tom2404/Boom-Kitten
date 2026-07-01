const {
  IsImplodingFaceUpCondition,
  IsImplodingFaceDownCondition,
  HasStreakingKittenCondition,
  HasDefuseCardCondition,
  HasZombieKittenCondition,
  AlwaysTrueCondition
} = require('../conditions/ExplosionConditions');

const KillPlayerEffect = require('./primitives/KillPlayerEffect');
const HoldBombEffect = require('./primitives/HoldBombEffect');
const ConsumeDefuseEffect = require('./primitives/ConsumeDefuseEffect');
const WaitInsertBombEffect = require('./primitives/WaitInsertBombEffect');

class ExplosionEngine {
  constructor(effectQueue) {
    this.effectQueue = effectQueue;
    
    // Define the Chain of Responsibility for Explosions
    this.rules = [
      {
        id: 'IMPLODING_FACE_UP',
        condition: new IsImplodingFaceUpCondition(),
        effects: [{ EffectClass: KillPlayerEffect, params: {} }],
        result: 'PLAYER_DIED'
      },
      {
        id: 'IMPLODING_FACE_DOWN',
        condition: new IsImplodingFaceDownCondition(),
        effects: [{ EffectClass: WaitInsertBombEffect, params: { type: 'imploding_face_down' } }],
        result: 'WAIT_INSERT'
      },
      {
        id: 'STREAKING_KITTEN',
        condition: new HasStreakingKittenCondition(),
        effects: [{ EffectClass: HoldBombEffect, params: {} }],
        result: 'BOMB_HELD'
      },
      {
        id: 'DEFUSE',
        condition: new HasDefuseCardCondition(),
        effects: [
          { EffectClass: ConsumeDefuseEffect, params: {} },
          { EffectClass: WaitInsertBombEffect, params: { type: 'defuse' } }
        ],
        result: 'WAIT_INSERT'
      },
      {
        id: 'ZOMBIE',
        condition: new HasZombieKittenCondition(),
        effects: [
          { EffectClass: ConsumeDefuseEffect, params: {} },
          { EffectClass: WaitInsertBombEffect, params: { type: 'zombie' } }
        ],
        result: 'WAIT_ZOMBIE'
      },
      {
        id: 'DEATH',
        condition: new AlwaysTrueCondition(),
        effects: [{ EffectClass: KillPlayerEffect, params: {} }],
        result: 'PLAYER_DIED'
      }
    ];
  }

  /**
   * Resolves the explosion using the Chain of Responsibility.
   * @param {Object} context - ExplosionContext { gameState, playerId, drawnCard, onDefuseCallback }
   * @returns {string} ExplosionResult enum
   */
  resolve(context) {
    for (const rule of this.rules) {
      const match = rule.condition.evaluate(context);
      if (match.matched) {
        // Build payload dynamically incorporating condition match data
        const payload = {
          playerId: context.playerId,
          drawnCard: context.drawnCard,
          onDefuseCallback: context.onDefuseCallback,
          ...match.data
        };

        // Enqueue the effects
        for (const effectDef of rule.effects) {
          const effectInstance = new effectDef.EffectClass(effectDef.params);
          // Wait, EffectQueue currently expects an action or an effect directly.
          // Since the Engine handles synchronous resolution here to modify state, 
          // we can either execute them immediately or push to queue. 
          // However, Explosion resolution in gameLogic historically needs to mutate immediately 
          // so the loop continues. Let's just execute them synchronously for now.
          effectInstance.execute({ state: context.gameState }, payload);
        }

        return rule.result;
      }
    }
    return 'GAME_OVER';
  }
}

module.exports = ExplosionEngine;
