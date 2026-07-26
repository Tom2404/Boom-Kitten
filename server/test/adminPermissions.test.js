const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ADMIN_ROLES,
  getAdminCapabilities,
  getAdminPolicy,
  hasAdminPermission,
  normalizeAdminRole,
} = require('../utils/adminPermissions');
const User = require('../models/User');

test('normalizes the legacy admin role to super_admin during migration', () => {
  assert.equal(normalizeAdminRole('admin'), 'super_admin');
  assert.equal(normalizeAdminRole('super_admin'), 'super_admin');
  assert.equal(normalizeAdminRole('user'), 'user');
});

test('recognizes only the approved administrative roles', () => {
  assert.deepEqual(ADMIN_ROLES, ['super_admin', 'operator', 'moderator', 'analyst']);
  assert.equal(getAdminCapabilities('user').length, 0);
  assert.equal(getAdminCapabilities('unknown').length, 0);
});

test('keeps analysts read-only while allowing redacted operational visibility', () => {
  assert.equal(hasAdminPermission('analyst', 'dashboard.read'), true);
  assert.equal(hasAdminPermission('analyst', 'players.read'), true);
  assert.equal(hasAdminPermission('analyst', 'audit.read'), true);
  assert.equal(hasAdminPermission('analyst', 'players.status.write'), false);
  assert.equal(hasAdminPermission('analyst', 'economy.adjust'), false);
  assert.equal(hasAdminPermission('analyst', 'incidents.write'), false);
});

test('separates moderator and operator responsibilities', () => {
  assert.equal(hasAdminPermission('moderator', 'moderation.resolve'), true);
  assert.equal(hasAdminPermission('moderator', 'moderation.sanction.ban'), true);
  assert.equal(hasAdminPermission('moderator', 'economy.adjust'), false);
  assert.equal(hasAdminPermission('operator', 'economy.adjust'), true);
  assert.equal(hasAdminPermission('operator', 'wagers.read'), true);
  assert.equal(hasAdminPermission('operator', 'wagers.resolve'), true);
  assert.equal(hasAdminPermission('analyst', 'wagers.read'), true);
  assert.equal(hasAdminPermission('analyst', 'wagers.resolve'), false);
  assert.equal(hasAdminPermission('operator', 'announcements.schedule'), true);
  assert.equal(hasAdminPermission('operator', 'players.role.write'), false);
  assert.equal(hasAdminPermission('operator', 'players.elo.write'), false);
  assert.equal(hasAdminPermission('operator', 'seasons.read'), false);
  assert.equal(hasAdminPermission('operator', 'seasons.write'), false);
  assert.equal(hasAdminPermission('super_admin', 'seasons.reset'), false);
});

test('maps legacy admin to the super-admin capability and threshold policy', () => {
  assert.equal(hasAdminPermission('admin', 'live_ops.publish'), true);
  assert.equal(hasAdminPermission('admin', 'players.role.write'), true);
  assert.equal(hasAdminPermission('admin', 'rooms.force_close'), true);
  assert.equal(hasAdminPermission('admin', 'rooms.disconnect'), true);
  assert.equal(hasAdminPermission('operator', 'rooms.force_close'), false);
  assert.equal(hasAdminPermission('operator', 'rooms.disconnect'), false);

  assert.deepEqual(getAdminPolicy('operator'), {
    maxCurrencyAdjustment: { coin: 10000 },
    maxSuspensionDays: 30,
    maxBulkTargets: 1000,
  });
  assert.deepEqual(getAdminPolicy('admin'), {
    maxCurrencyAdjustment: null,
    maxSuspensionDays: 365,
    maxBulkTargets: 10000,
  });
});

test('allows approved admin roles and the temporary legacy role in the user schema', () => {
  const allowedRoles = User.schema.path('role').enumValues;

  assert.deepEqual(allowedRoles, ['user', 'admin', 'super_admin', 'operator', 'moderator', 'analyst']);
});
