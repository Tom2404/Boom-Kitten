const ActionDispatcher = require('./ActionDispatcher');
const EffectFactory = require('../effects/EffectFactory');
const EffectEngine = require('../effects/EffectEngine');

const PlayCardAction = require('./PlayCardAction');
const PlayCardInitAction = require('./PlayCardInitAction');
const DrawCardAction = require('./DrawCardAction');
const InteractionTimeoutAction = require('./InteractionTimeoutAction');
const SubmitInteractionResponseAction = require('./SubmitInteractionResponseAction');

const dispatcher = new ActionDispatcher(EffectFactory, EffectEngine);

dispatcher.registerAction('PLAY_CARD', new PlayCardAction());
dispatcher.registerAction('PLAY_CARD_INIT', new PlayCardInitAction());
dispatcher.registerAction('drawCard', new DrawCardAction());
dispatcher.registerAction('SUBMIT_INTERACTION', new SubmitInteractionResponseAction());
dispatcher.registerAction('INTERACTION_TIMEOUT', new InteractionTimeoutAction());


module.exports = { dispatcher };
