const ACTIVITY_TABS = new Set(['chat', 'log']);

export function getHandDockState({ handCount, maxHandSize, isMyTurn }) {
  if (handCount > maxHandSize) return 'danger';
  return isMyTurn ? 'turn' : 'idle';
}

export function getActivityTabConfig(tab) {
  const safeTab = ACTIVITY_TABS.has(tab) ? tab : 'chat';
  return {
    tabId: `game-activity-tab-${safeTab}`,
    panelId: `game-activity-panel-${safeTab}`,
  };
}

export function getFocusLoopIndex({ currentIndex, count, backwards }) {
  if (count <= 0) return -1;
  const direction = backwards ? -1 : 1;
  return (currentIndex + direction + count) % count;
}

export function canRespondToNopeWindow({ myUserId, responseOwnerId }) {
  return Boolean(myUserId && responseOwnerId && myUserId !== responseOwnerId);
}

export function getInteractionRequestState(request) {
  if (!request?.active) return 'idle';
  return request.responded ? 'waiting' : 'respond';
}

export function getPlayerStatus({ alive = true, isCurrentTurn = false, isTargetable = false, isSelectedTarget = false, isWaiting = false }) {
  if (!alive) return 'eliminated';
  if (isSelectedTarget) return 'selected-target';
  if (isTargetable) return 'targetable';
  if (isWaiting) return 'waiting-response';
  if (isCurrentTurn) return 'active-turn';
  return 'normal';
}

export function getActivityStatus({ isOpen = false, hasUnreadMessages = false, connectionState = 'connected' }) {
  if (connectionState === 'error') return 'connection-error';
  if (connectionState !== 'connected') return 'reconnecting';
  if (isOpen) return 'open';
  if (hasUnreadMessages) return 'unread';
  return 'closed';
}

export function getHandActionLabel({
  canPerformAction = false,
  comboCount = 0,
  isMyTurn,
  mustDiscard = false,
  selectedCount = 0,
}) {
  if (mustDiscard) return selectedCount > 0 && canPerformAction ? 'Bỏ lá đã chọn' : 'Chọn lá để bỏ';
  if (selectedCount === 0) return isMyTurn ? 'Chọn một lá' : 'Chờ lượt';
  if (!canPerformAction) return 'Không thể đánh';
  return comboCount > 1 ? `Đánh combo ${comboCount}` : 'Đánh thẻ';
}
