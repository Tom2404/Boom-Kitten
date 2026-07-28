/**
 * Centralized Interaction State Handler for Boom-Kitten
 * Solves prompt fragmentation and ensures target selection rules originate strictly from game state.
 */

export function getInteractionState({ gameState, myUserId, privateHand, nopeWindow }) {
  if (!gameState) {
    return {
      mode: 'idle',
      message: 'Đang kết nối trận đấu...',
      eligibleTargetIds: [],
      sourceCardId: null,
    };
  }

  const activePlayer = gameState.players?.find((p) => p.userId === gameState.players[gameState.currentPlayerIndex]?.userId);
  const activePlayerName = activePlayer?.username || 'Người chơi';
  const isMyTurn = activePlayer?.userId === myUserId;

  // 1. Target selection mode (Favor, Combo, Attack target, etc.)
  if (gameState.pendingSelectTarget) {
    const isTargetChooser = gameState.pendingSelectTarget.chooserUserId === myUserId;
    return {
      mode: 'select-target',
      message: isTargetChooser
        ? 'Chọn 1 đối thủ làm mục tiêu'
        : `${activePlayerName} đang chọn mục tiêu...`,
      eligibleTargetIds: isTargetChooser ? (gameState.pendingSelectTarget.eligibleUserIds || []) : [],
      sourceCardId: gameState.pendingSelectTarget.sourceCardId || null,
    };
  }

  // 2. Select card from Discard Pile (Combo 5)
  if (gameState.pendingCombo5) {
    const isChooser = gameState.pendingCombo5.userId === myUserId;
    return {
      mode: 'select-discard-card',
      message: isChooser
        ? 'Chọn 1 lá bài từ Chồng bài bỏ'
        : `${activePlayerName} đang chọn bài từ Chồng bài bỏ...`,
      eligibleTargetIds: [],
      sourceCardId: null,
    };
  }

  // 3. Favor response
  if (gameState.pendingFavor) {
    const isTarget = gameState.pendingFavor.targetUserId === myUserId;
    return {
      mode: 'favor-response',
      message: isTarget
        ? `Chọn 1 lá bài tặng cho ${gameState.pendingFavor.requestorName || 'đối thủ'}`
        : `Đang chờ ${gameState.pendingFavor.targetName || 'đối thủ'} đưa bài...`,
      eligibleTargetIds: [],
      sourceCardId: null,
    };
  }

  // 4. Active NOPE Window
  if (nopeWindow?.active) {
    return {
      mode: 'pending-nope',
      message: 'Cửa sổ NOPE đang mở! Đánh lá NOPE để chặn',
      eligibleTargetIds: [],
      sourceCardId: null,
    };
  }

  // 5. Normal Turn Mode
  if (isMyTurn) {
    const drawsReq = gameState.drawsRequired ?? 1;
    return {
      mode: 'my-turn',
      message: `Lượt của bạn — Cần bốc ${drawsReq} lá bài`,
      eligibleTargetIds: [],
      sourceCardId: null,
    };
  }

  return {
    mode: 'idle',
    message: `Lượt của ${activePlayerName}`,
    eligibleTargetIds: [],
    sourceCardId: null,
  };
}
