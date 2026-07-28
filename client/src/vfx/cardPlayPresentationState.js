export const CARD_PLAY_STATES = {
    IDLE: 'IDLE',
    FLYING_UP: 'FLYING_UP',
    PENDING: 'PENDING',
    RESOLVING: 'RESOLVING',
    CANCELLED: 'CANCELLED',
    FLYING_DOWN: 'FLYING_DOWN',
    COMPLETED: 'COMPLETED',
};

const STATE_TRANSITIONS = {
    [CARD_PLAY_STATES.IDLE]: [CARD_PLAY_STATES.FLYING_UP],
    [CARD_PLAY_STATES.FLYING_UP]: [CARD_PLAY_STATES.PENDING, CARD_PLAY_STATES.IDLE],
    [CARD_PLAY_STATES.PENDING]: [CARD_PLAY_STATES.RESOLVING, CARD_PLAY_STATES.CANCELLED, CARD_PLAY_STATES.IDLE],
    [CARD_PLAY_STATES.RESOLVING]: [CARD_PLAY_STATES.FLYING_DOWN, CARD_PLAY_STATES.IDLE],
    [CARD_PLAY_STATES.CANCELLED]: [CARD_PLAY_STATES.FLYING_DOWN, CARD_PLAY_STATES.IDLE],
    [CARD_PLAY_STATES.FLYING_DOWN]: [CARD_PLAY_STATES.COMPLETED, CARD_PLAY_STATES.IDLE],
    [CARD_PLAY_STATES.COMPLETED]: [CARD_PLAY_STATES.IDLE],
};

export function canTransitionPresentation(currentState, nextState) {
    return (STATE_TRANSITIONS[currentState] || []).includes(nextState);
}

export function deferNopeUntilPending(action, nopeAction) {
    if (action.state !== CARD_PLAY_STATES.FLYING_UP) return false;
    action.deferredNopes.push(nopeAction);
    return true;
}

export function deferResultUntilPending(action, result) {
    if (action.state !== CARD_PLAY_STATES.FLYING_UP) return false;
    action.pendingResult = result;
    return true;
}

export function getDiscardMaskCount(action) {
    return 1 + (action.nopeStack?.length || 0) + (action.deferredNopes?.length || 0);
}
