import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canRespondToNopeWindow,
  getActivityTabConfig,
  getActivityStatus,
  getFocusLoopIndex,
  getHandActionLabel,
  getHandCardLayout,
  getHandDockState,
  getInteractionRequestState,
  getPlayerStatus,
  getReconnectRemainingSeconds,
  shouldResumeActiveMatch,
} from '../src/utils/gameRoomUi.js';

test('hand dock uses danger treatment only when the hand exceeds its limit', () => {
  assert.equal(getHandDockState({ handCount: 11, maxHandSize: 10, isMyTurn: true }), 'danger');
  assert.equal(getHandDockState({ handCount: 10, maxHandSize: 10, isMyTurn: true }), 'turn');
});

test('hand dock distinguishes the local turn from a waiting state', () => {
  assert.equal(getHandDockState({ handCount: 6, maxHandSize: 10, isMyTurn: true }), 'turn');
  assert.equal(getHandDockState({ handCount: 6, maxHandSize: 10, isMyTurn: false }), 'idle');
});

test('hand card layout stays readable from one card through the discard overflow card', () => {
  const single = getHandCardLayout({ cardCount: 1, index: 0 });
  assert.deepEqual(single, {
    rotate: 0,
    y: 0,
    marginLeft: 0,
    shouldCenter: true,
  });

  for (const cardCount of [6, 10, 11]) {
    const positions = Array.from(
      { length: cardCount },
      (_, index) => getHandCardLayout({ cardCount, index })
    );

    assert.ok(positions.every(({ rotate }) => Math.abs(rotate) <= 6));
    assert.ok(positions.every(({ y }) => y >= 0 && y <= 8));
    assert.equal(positions[0].marginLeft, 0);
  }

  assert.equal(getHandCardLayout({ cardCount: 6, index: 1 }).marginLeft, 0);
  assert.ok(getHandCardLayout({ cardCount: 10, index: 1 }).marginLeft < 0);
  assert.equal(getHandCardLayout({ cardCount: 10, index: 0 }).shouldCenter, true);
  assert.equal(getHandCardLayout({ cardCount: 11, index: 0 }).shouldCenter, false);
});

test('activity tabs expose stable ids for accessible tab and panel relationships', () => {
  assert.deepEqual(getActivityTabConfig('chat'), {
    tabId: 'game-activity-tab-chat',
    panelId: 'game-activity-panel-chat',
  });
  assert.deepEqual(getActivityTabConfig('log'), {
    tabId: 'game-activity-tab-log',
    panelId: 'game-activity-panel-log',
  });
});

test('drawer focus loops at both ends', () => {
  assert.equal(getFocusLoopIndex({ currentIndex: 0, count: 4, backwards: true }), 3);
  assert.equal(getFocusLoopIndex({ currentIndex: 3, count: 4, backwards: false }), 0);
  assert.equal(getFocusLoopIndex({ currentIndex: 1, count: 4, backwards: false }), 2);
  assert.equal(getFocusLoopIndex({ currentIndex: 1, count: 4, backwards: true }), 0);
});

test('the player who created the current reaction window cannot respond to it', () => {
  assert.equal(canRespondToNopeWindow({ myUserId: 'a', responseOwnerId: 'a' }), false);
  assert.equal(canRespondToNopeWindow({ myUserId: 'b', responseOwnerId: 'a' }), true);
});

test('a resumed interaction that already has a response becomes a waiting state', () => {
  assert.equal(getInteractionRequestState({ active: true, responded: false }), 'respond');
  assert.equal(getInteractionRequestState({ active: true, responded: true }), 'waiting');
  assert.equal(getInteractionRequestState(null), 'idle');
});

test('player status priority is explicit and never color-only', () => {
  assert.equal(getPlayerStatus({ alive: false, forfeited: true }), 'forfeited');
  assert.equal(getPlayerStatus({ alive: false, isCurrentTurn: true }), 'eliminated');
  assert.equal(getPlayerStatus({ connectionStatus: 'reconnecting' }), 'reconnecting');
  assert.equal(getPlayerStatus({ isTargetable: true, isCurrentTurn: true }), 'targetable');
  assert.equal(getPlayerStatus({ isSelectedTarget: true, isTargetable: true }), 'selected-target');
  assert.equal(getPlayerStatus({ isWaiting: true }), 'waiting-response');
  assert.equal(getPlayerStatus({ isCurrentTurn: true }), 'active-turn');
  assert.equal(getPlayerStatus({}), 'normal');
});

test('reconnect countdown is server-deadline based and clamps at zero', () => {
  assert.equal(getReconnectRemainingSeconds(61_000, 1_000), 60);
  assert.equal(getReconnectRemainingSeconds(60_001, 1_000), 60);
  assert.equal(getReconnectRemainingSeconds(60_000, 60_000), 0);
  assert.equal(getReconnectRemainingSeconds(60_000, 60_001), 0);
  assert.equal(getReconnectRemainingSeconds(null, 1_000), 0);
});

test('only a playing room automatically resumes the Game page', () => {
  assert.equal(shouldResumeActiveMatch({ status: 'playing' }), true);
  assert.equal(shouldResumeActiveMatch({ status: 'waiting' }), false);
  assert.equal(shouldResumeActiveMatch(null), false);
});

test('activity status distinguishes unread, open and connection states', () => {
  assert.equal(getActivityStatus({ hasUnreadMessages: true }), 'unread');
  assert.equal(getActivityStatus({ isOpen: true, hasUnreadMessages: true }), 'open');
  assert.equal(getActivityStatus({ connectionState: 'reconnecting' }), 'reconnecting');
  assert.equal(getActivityStatus({ connectionState: 'error' }), 'connection-error');
});

test('hand action copy explains why the primary action is unavailable', () => {
  assert.equal(getHandActionLabel({ isMyTurn: false, selectedCount: 0 }), 'Chờ lượt');
  assert.equal(getHandActionLabel({ isMyTurn: true, selectedCount: 0 }), 'Chọn một lá');
  assert.equal(getHandActionLabel({ isMyTurn: true, selectedCount: 1, canPerformAction: true }), 'Đánh thẻ');
  assert.equal(getHandActionLabel({ isMyTurn: true, selectedCount: 0, mustDiscard: true }), 'Chọn lá để bỏ');
  assert.equal(getHandActionLabel({ isMyTurn: true, selectedCount: 1, mustDiscard: true, canPerformAction: true }), 'Bỏ lá đã chọn');
});
