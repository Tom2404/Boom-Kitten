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

  getEffects() {
    return [
      {
        execute: (context, payload) => {
          const state = context.state;
          const interaction = state.activeInteraction;
          if (!interaction || interaction.id !== payload.interactionId) return;

          const type = interaction.type;

          if (type === 'pot_luck' || type === 'garbage_collection' || type === 'feed_the_dead' || type === 'grave_robber') {
            [...interaction.participants].forEach(pId => {
              if (state.activeInteraction && interaction.responses[pId] === undefined) {
                const player = state.players.find(p => p.userId === pId);
                if (player && player.hand.length > 0) {
                  InteractionManager.recordResponse(context, pId, player.hand[0].id);
                } else {
                  InteractionManager.recordResponse(context, pId, null);
                }
              }
            });
          } else {
            InteractionManager.cancelInteraction(context);
          }
        }
      }
    ];
  }
}

module.exports = InteractionTimeoutAction;
