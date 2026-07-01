const BaseAction = require('./BaseAction');
const InteractionManager = require('../interactions/InteractionManager');

class SubmitInteractionResponseAction extends BaseAction {
  validate(context, payload) {
    const { userId, responseData } = payload;
    const gameState = context.state;
    
    // Check if there is an active interaction
    if (!gameState.activeInteraction) {
      return { valid: false, reason: 'No active interaction' };
    }

    // Check if user is a participant
    if (!gameState.activeInteraction.participants.includes(userId)) {
      return { valid: false, reason: 'User is not a participant' };
    }

    // Check if user already responded
    if (gameState.activeInteraction.responses[userId] !== undefined) {
      return { valid: false, reason: 'User already responded' };
    }

    // Further validation could be done based on activeInteraction.type (e.g. check if cardId is in hand)

    return { valid: true };
  }

  execute(context, payload) {
    console.log('--- SubmitInteractionResponseAction execute called for userId:', payload.userId);
    const { userId, responseData } = payload;
    // Record response, InteractionManager will handle completion if everyone responded
    InteractionManager.recordResponse(context, userId, responseData);
    
    // Return NO_EFFECT since the InteractionManager handles Queue pushing
    return { status: 'SUCCESS' };
  }
}

module.exports = SubmitInteractionResponseAction;
