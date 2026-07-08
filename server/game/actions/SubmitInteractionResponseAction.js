const BaseAction = require('./BaseAction');
const InteractionManager = require('../interactions/InteractionManager');
const { validateInteractionResponse } = require('../interactions/interactionGuards');

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

    if (payload.interactionId && gameState.activeInteraction.id !== payload.interactionId) {
      return { valid: false, reason: 'Interaction ID mismatch' };
    }

    const responseValidation = validateInteractionResponse(gameState, userId, responseData);
    if (!responseValidation.valid) {
      return responseValidation;
    }

    return { valid: true };
  }

  execute(context, payload) {
    const { userId, responseData } = payload;
    // Record response, InteractionManager will handle completion if everyone responded
    InteractionManager.recordResponse(context, userId, responseData);
    
    // Return NO_EFFECT since the InteractionManager handles Queue pushing
    return { status: 'SUCCESS' };
  }
}

module.exports = SubmitInteractionResponseAction;
