const { randomUUID } = require('crypto');
const EffectFactory = require('../effects/EffectFactory');
const EffectEngine = require('../effects/EffectEngine');

class InteractionManager {
  /**
   * Creates a new interaction and attaches it to the game state.
   * @param {Object} context - GameContext
   * @param {Object} config - { type, owner, participants, metadata, timeout, onCompleteEffects }
   * @returns {Object} The created interaction
   */
  static createInteraction(context, config) {
    const state = context.state;
    
    // Filter participants to only those who are alive (and optionally have cards if needed)
    // The exact filtering should happen before calling createInteraction, or we assume participants are pre-validated.
    const activeParticipants = config.participants;
    
    // If no participants, complete immediately or cancel.
    if (!activeParticipants || activeParticipants.length === 0) {
       return { status: 'NO_PARTICIPANTS' };
    }

    const interaction = {
      id: config.id || randomUUID(),
      type: config.type,
      owner: config.owner,
      participants: activeParticipants,
      responses: {},
      status: 'WAITING',
      startedAt: Date.now(),
      timeout: config.timeout || 15000,
      metadata: config.metadata || {},
      onCompleteEffects: config.onCompleteEffects || [] // Array of effect definitions to generate
    };

    state.activeInteraction = interaction;
    return interaction;
  }

  /**
   * Records a response from a participant.
   * @param {Object} context - GameContext
   * @param {string} participantId - The user submitting the response
   * @param {any} responseData - The data payload of the response
   * @returns {string} InteractionResult ('PARTIAL', 'COMPLETED', 'FAILED')
   */
  static recordResponse(context, participantId, responseData) {
    const state = context.state;
    const interaction = state.activeInteraction;
    
    if (!interaction || interaction.status !== 'WAITING' && interaction.status !== 'PARTIAL') {
      return 'FAILED';
    }

    if (!interaction.participants.includes(participantId)) {
      return 'FAILED';
    }

    interaction.responses[participantId] = responseData;

    // Check if all participants have responded
    const allResponded = interaction.participants.every(pId => interaction.responses[pId] !== undefined);
    
    if (allResponded) {
      interaction.status = 'COMPLETED';
      return this.completeInteraction(context);
    } else {
      interaction.status = 'PARTIAL';
      return 'PARTIAL';
    }
  }

  /**
   * Completes the interaction and queues the generated effects.
   * @param {Object} context - GameContext
   */
  static completeInteraction(context) {
    const state = context.state;
    const interaction = state.activeInteraction;
    
    if (!interaction) return 'FAILED';
    interaction.status = 'COMPLETED';

    // Generate effects based on responses
    if (interaction.onCompleteEffects.length > 0) {
      interaction.onCompleteEffects.forEach(effectDef => {
        // We inject the interaction responses into the payload of the effect
        const payload = {
          interactionId: interaction.id,
          type: interaction.type,
          responses: interaction.responses,
          metadata: interaction.metadata,
          owner: interaction.owner
        };
        
        const effectInstance = EffectFactory.createEffect(effectDef.type, effectDef.params);
        if (effectInstance) {
          context.effectQueue.enqueue({ effect: effectInstance, payload });
        }
      });

      // Run the queue
      EffectEngine.processQueue(context);
    }

    // Clear interaction from state
    state.activeInteraction = null;
    return 'COMPLETED';
  }

  /**
   * Cancels the interaction (e.g. timeout, owner left).
   * @param {Object} context - GameContext
   */
  static cancelInteraction(context) {
    const state = context.state;
    if (state.activeInteraction) {
      state.activeInteraction.status = 'CANCELLED';
      state.activeInteraction = null;
    }
    return 'CANCELLED';
  }
}

module.exports = InteractionManager;
