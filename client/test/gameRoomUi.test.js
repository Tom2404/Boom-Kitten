import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canRespondToNopeWindow,
  getActivityTabConfig,
  getActivityStatus,
  getFocusLoopIndex,
  getHandActionLabel,
  getHandDockState,
  getInteractionRequestState,
  getPlayerStatus,
} from '../src/utils/gameRoomUi.js';

test('hand dock uses danger treatment only when the hand exceeds its limit', () => {
  assert.equal(getHandDockState({ handCount: 11, maxHandSize: 10, isMyTurn: true }), 'danger');
  assert.equal(getHandDockState({ handCount: 10, maxHandSize: 10, isMyTurn: true }), 'turn');
});

test('hand dock distinguishes the local turn from a waiting state', () => {
  assert.equal(getHandDockState({ handCount: 6, maxHandSize: 10, isMyTurn: true }), 'turn');
  assert.equal(getHandDockState({ handCount: 6, maxHandSize: 10, isMyTurn: false }), 'idle');
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
  assert.equal(getPlayerStatus({ alive: false, isCurrentTurn: true }), 'eliminated');
  assert.equal(getPlayerStatus({ isTargetable: true, isCurrentTurn: true }), 'targetable');
  assert.equal(getPlayerStatus({ isSelectedTarget: true, isTargetable: true }), 'selected-target');
  assert.equal(getPlayerStatus({ isWaiting: true }), 'waiting-response');
  assert.equal(getPlayerStatus({ isCurrentTurn: true }), 'active-turn');
  assert.equal(getPlayerStatus({}), 'normal');
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
