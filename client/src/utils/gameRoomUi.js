const ACTIVITY_TABS = new Set(['chat', 'log']);

export function getHandDockState({ handCount, maxHandSize, isMyTurn }) {
  if (handCount > maxHandSize) return 'danger';
  return isMyTurn ? 'turn' : 'idle';
}

export function getHandCardLayout({ cardCount, index, isNewGroup = false }) {
  const count = Math.max(1, Math.min(11, Math.trunc(Number(cardCount)) || 1));
  const safeIndex = Math.max(0, Math.min(count - 1, Math.trunc(Number(index)) || 0));
  const middle = (count - 1) / 2;
  const distance = safeIndex - middle;
  const overlap = count <= 6 ? 0 : Math.min(20, (count - 6) * 4);
  const maxRotation = Math.min(6, (count - 1) * 0.75);
  const arcHeight = Math.min(8, count - 1);

  return {
    rotate: count > 1 ? (distance / middle) * maxRotation : 0,
    y: count > 1 ? (distance ** 2 / middle ** 2) * arcHeight : 0,
    marginLeft: safeIndex > 0 && overlap > 0
      ? -Math.max(0, overlap - (isNewGroup ? 8 : 0))
      : 0,
    shouldCenter: count <= 10,
  };
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

export function getPlayerStatus({
  alive = true,
  connectionStatus = 'connected',
  forfeited = false,
  isCurrentTurn = false,
  isTargetable = false,
  isSelectedTarget = false,
  isWaiting = false,
}) {
  if (forfeited) return 'forfeited';
  if (!alive) return 'eliminated';
  if (connectionStatus === 'reconnecting') return 'reconnecting';
  if (isSelectedTarget) return 'selected-target';
  if (isTargetable) return 'targetable';
  if (isWaiting) return 'waiting-response';
  if (isCurrentTurn) return 'active-turn';
  return 'normal';
}

export function getReconnectRemainingSeconds(deadline, now = Date.now()) {
  if (!Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function shouldResumeActiveMatch(room) {
  return room?.status === 'playing';
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
