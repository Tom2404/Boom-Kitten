const BaseAction = require('./BaseAction');
const InteractionManager = require('../interactions/InteractionManager');

class InteractionTimeoutAction extends BaseAction {
  validate(context, payload) {
    const { interactionId } = payload;
    const state = context.state;

    if (!state.activeInteraction || state.activeInteraction.id !== interactionId) {
      return { valid: false, error: 'Interaction no longer active or ID mismatch.' };
    }

    return { valid: true, payload };
  }

  getEffectFactories() {
    return [
      {
        effect: {
          execute: (context, payload) => {
            const state = context.state;
            const interaction = state.activeInteraction;
            if (!interaction || interaction.id !== payload.interactionId) return;

            // Simple timeout handling: For now, we auto-cancel or auto-randomize based on type.
            const type = interaction.type;
            
            if (type === 'pot_luck' || type === 'garbage_collection' || type === 'feed_the_dead' || type === 'grave_robber') {
              interaction.participants.forEach(pId => {
                if (interaction.responses[pId] === undefined) {
                  const player = state.players.find(p => p.userId === pId);
                  if (player && player.alive && player.hand.length > 0) {
                    // Force pick the first card
                    InteractionManager.recordResponse(context, pId, player.hand[0].id);
                  } else {
                    // Force a null response if they have no cards
                    InteractionManager.recordResponse(context, pId, null);
                  }
                }
              });
            } else {
               // Cancel for targeted interactions like favor, alter, bury, etc.
               InteractionManager.cancelInteraction(context);
            }
          }
        }
      }
    ];
  }
}

module.exports = InteractionTimeoutAction;
