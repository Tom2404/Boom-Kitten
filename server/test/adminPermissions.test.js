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

test('keeps the two approved admin roles distinct', () => {
  assert.equal(normalizeAdminRole('admin'), 'admin');
  assert.equal(normalizeAdminRole('super_admin'), 'super_admin');
  assert.equal(normalizeAdminRole('user'), 'user');
});

test('recognizes only the approved administrative roles', () => {
  assert.deepEqual(ADMIN_ROLES, ['admin', 'super_admin']);
  assert.equal(getAdminCapabilities('user').length, 0);
  assert.equal(getAdminCapabilities('operator').length, 0);
  assert.equal(getAdminCapabilities('unknown').length, 0);
});

test('allows admins to manage users, resources, and tournaments', () => {
  for (const permission of [
    'dashboard.read',
    'players.read',
    'players.status.write',
    'economy.adjust',
    'catalog.read',
    'catalog.write',
    'quests.read',
    'quests.write',
    'tournaments.read',
    'tournaments.write',
    'moderation.read',
    'moderation.write',
  ]) {
    assert.equal(hasAdminPermission('admin', permission), true, permission);
  }
});

test('does not retain permissions for removed admin modules', () => {
  for (const role of ADMIN_ROLES) {
    for (const permission of ['jobs.read', 'incidents.read', 'analytics.read', 'rooms.read', 'audit.read', 'wagers.read', 'live_ops.read', 'announcements.read']) {
      assert.equal(hasAdminPermission(role, permission), false, `${role}: ${permission}`);
    }
  }
});

test('reserves role changes and tournament payouts for super admins', () => {
  assert.equal(hasAdminPermission('admin', 'players.role.write'), false);
  assert.equal(hasAdminPermission('admin', 'tournaments.payout'), false);
  assert.equal(hasAdminPermission('admin', 'tournaments.refund'), true);
  assert.equal(hasAdminPermission('admin', 'tournaments.override'), false);
  assert.equal(hasAdminPermission('super_admin', 'players.role.write'), true);
  assert.equal(hasAdminPermission('super_admin', 'tournaments.payout'), true);
  assert.equal(hasAdminPermission('super_admin', 'tournaments.override'), true);

  assert.deepEqual(getAdminPolicy('admin'), {
    maxCurrencyAdjustment: { coin: 10000 },
    maxSuspensionDays: 30,
  });
  assert.deepEqual(getAdminPolicy('super_admin'), {
    maxCurrencyAdjustment: null,
    maxSuspensionDays: 365,
  });
});

test('allows only user and the two approved admin roles in the user schema', () => {
  const allowedRoles = User.schema.path('role').enumValues;

  assert.deepEqual(allowedRoles, ['user', 'admin', 'super_admin']);
});
