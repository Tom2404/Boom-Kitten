const ActionDispatcher = require('./ActionDispatcher');
const EffectFactory = require('../effects/EffectFactory');
const EffectEngine = require('../effects/EffectEngine');

const PlayCardAction = require('./PlayCardAction');
const DrawCardAction = require('./DrawCardAction');
const InteractionTimeoutAction = require('./InteractionTimeoutAction');
const SubmitInteractionResponseAction = require('./SubmitInteractionResponseAction');

const dispatcher = new ActionDispatcher(EffectFactory, EffectEngine);

dispatcher.registerAction('PLAY_CARD', new PlayCardAction());
dispatcher.registerAction('drawCard', new DrawCardAction());
dispatcher.registerAction('SUBMIT_INTERACTION', new SubmitInteractionResponseAction());
dispatcher.registerAction('INTERACTION_TIMEOUT', new InteractionTimeoutAction());


module.exports = { dispatcher };
