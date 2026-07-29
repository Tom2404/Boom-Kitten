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
    return (action.cardCount || 1)
        + (action.nopeStack?.length || 0)
        + (action.deferredNopes?.length || 0);
}

export function getCardFanLayout(count) {
    const safeCount = Math.max(1, Math.min(5, Number(count) || 1));
    const center = (safeCount - 1) / 2;

    return Array.from({ length: safeCount }, (_, index) => {
        const distance = index - center;
        return {
            x: distance * (safeCount === 2 ? 0.32 : 0.24),
            y: center ? Math.abs(distance / center) * 0.05 : 0,
            rotation: distance * (safeCount === 2 ? 12 : 9),
        };
    });
}

export function getCardResolutionMotion({
    cardType = '',
    isResolved,
    nopeCount = 0,
    reducedMotion = false,
}) {
    const accent = cardType.includes('attack')
        ? '#f97316'
        : cardType === 'reverse'
            ? '#10b981'
            : cardType.includes('future')
                ? '#a855f7'
                : '#facc15';

    return {
        accent: isResolved ? accent : '#dc2626',
        holdSeconds: reducedMotion ? 0.65 : (nopeCount > 0 ? 0.65 : 0.42),
        label: isResolved
            ? (nopeCount > 0 ? 'HÀNH ĐỘNG TIẾP TỤC!' : 'ĐÃ KÍCH HOẠT!')
            : 'ĐÃ BỊ VÔ HIỆU HÓA!',
        scale: reducedMotion ? 1 : (isResolved ? 1.12 : 0.94),
        rotation: reducedMotion ? 0 : (isResolved ? 2 : -4),
    };
}
