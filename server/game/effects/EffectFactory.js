const { CARD_DEFINITIONS } = require('../data/cardDefinitions');

// Import Primitive Effects
const AlterTurnCountEffect = require('./primitives/AlterTurnCountEffect');
const EndTurnWithoutDrawEffect = require('./primitives/EndTurnWithoutDrawEffect');
const ReverseDirectionEffect = require('./primitives/ReverseDirectionEffect');
const ShuffleDeckEffect = require('./primitives/ShuffleDeckEffect');
const RequestInteractionEffect = require('./primitives/RequestInteractionEffect');
const CollectPotLuckResponsesEffect = require('./primitives/CollectPotLuckResponsesEffect');
const CollectGarbageResponsesEffect = require('./primitives/CollectGarbageResponsesEffect');
const CollectFavorResponseEffect = require('./primitives/CollectFavorResponseEffect');
const CollectFeedTheDeadResponsesEffect = require('./primitives/CollectFeedTheDeadResponsesEffect');
const CollectGraveRobberResponsesEffect = require('./primitives/CollectGraveRobberResponsesEffect');
const ApplyAlterFutureResponseEffect = require('./primitives/ApplyAlterFutureResponseEffect');
const ApplyBuryResponseEffect = require('./primitives/ApplyBuryResponseEffect');
const ApplyDigDeeperResponseEffect = require('./primitives/ApplyDigDeeperResponseEffect');
const ConsumeDefuseEffect = require('./primitives/ConsumeDefuseEffect');
const DrawSpecificCardEffect = require('./primitives/DrawSpecificCardEffect');
const ExtractCardsEffect = require('./primitives/ExtractCardsEffect');
const HoldBombEffect = require('./primitives/HoldBombEffect');
const InsertExtractedCardsToTopEffect = require('./primitives/InsertExtractedCardsToTopEffect');
const KillPlayerEffect = require('./primitives/KillPlayerEffect');
const MarkCardEffect = require('./primitives/MarkCardEffect');
const PeekDeckEffect = require('./primitives/PeekDeckEffect');
const RemoveStatusEffect = require('./primitives/RemoveStatusEffect');
const ApplyStatusEffect = require('./primitives/ApplyStatusEffect');
const SwapTopBottomEffect = require('./primitives/SwapTopBottomEffect');
const TransferCardEffect = require('./primitives/TransferCardEffect');
const WaitInsertBombEffect = require('./primitives/WaitInsertBombEffect');
const ResolveComboEffect = require('./primitives/ResolveComboEffect');

// Map string names to classes
const EFFECT_CLASSES = {
  AlterTurnCount: AlterTurnCountEffect,
  EndTurnWithoutDraw: EndTurnWithoutDrawEffect,
  ReverseDirection: ReverseDirectionEffect,
  ShuffleDeck: ShuffleDeckEffect,
  RequestInteraction: RequestInteractionEffect,
  CollectPotLuckResponses: CollectPotLuckResponsesEffect,
  CollectGarbageResponses: CollectGarbageResponsesEffect,
  CollectFavorResponse: CollectFavorResponseEffect,
  CollectFeedTheDeadResponses: CollectFeedTheDeadResponsesEffect,
  CollectGraveRobberResponses: CollectGraveRobberResponsesEffect,
  ApplyAlterFutureResponse: ApplyAlterFutureResponseEffect,
  ApplyBuryResponse: ApplyBuryResponseEffect,
  ApplyDigDeeperResponse: ApplyDigDeeperResponseEffect,
  ConsumeDefuse: ConsumeDefuseEffect,
  DrawSpecificCard: DrawSpecificCardEffect,
  ExtractCards: ExtractCardsEffect,
  HoldBomb: HoldBombEffect,
  InsertExtractedCardsToTop: InsertExtractedCardsToTopEffect,
  KillPlayer: KillPlayerEffect,
  MarkCard: MarkCardEffect,
  PeekDeck: PeekDeckEffect,
  RemoveStatus: RemoveStatusEffect,
  ApplyStatus: ApplyStatusEffect,
  SwapTopBottom: SwapTopBottomEffect,
  TransferCard: TransferCardEffect,
  WaitInsertBomb: WaitInsertBombEffect,
  ResolveCombo: ResolveComboEffect,
};

class EffectFactory {
  /**
   * Creates instances of effects mapped to a specific card type or action type.
   * Reads from data-driven configuration.
   * @param {string} type - Card type or Action type.
   * @param {Object} payload - The action payload to pass to the effect constructors.
   * @returns {Array<Object>} An array of effect instances.
   */
  static createEffects(type, payload) {
    if (type && type.startsWith('combo_')) {
      return [new ResolveComboEffect(payload || {})];
    }

    const cardDef = CARD_DEFINITIONS[type];
    
    // If the card is defined and has primitive effects mapped
    if (cardDef && Array.isArray(cardDef.effects) && cardDef.effects.length > 0) {
      return cardDef.effects.map(effectConfig => {
        const EffectClass = EFFECT_CLASSES[effectConfig.type];
        if (!EffectClass) {
          console.warn(`[EffectFactory] Unknown effect class: ${effectConfig.type} for card: ${type}`);
          return null;
        }
        return new EffectClass(effectConfig.params || {});
      }).filter(effect => effect !== null);
    }

    // No legacy fallback, if effect type is unknown, log and skip
    console.warn(`[EffectFactory] Unknown effect type: ${type}`);
    return [];
  }

  /**
   * Creates a single effect instance by its class name string.
   * @param {string} effectType - The string name of the effect class in EFFECT_CLASSES.
   * @param {Object} params - The params to pass to the effect constructor.
   * @returns {Object|null} The effect instance or null if not found.
   */
  static createEffect(effectType, params = {}) {
    const EffectClass = EFFECT_CLASSES[effectType];
    if (!EffectClass) {
      console.warn(`[EffectFactory] Unknown single effect class: ${effectType}`);
      return null;
    }
    return new EffectClass(params);
  }
}

module.exports = EffectFactory;
