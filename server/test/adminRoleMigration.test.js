const test = require('node:test');
const assert = require('node:assert/strict');

const { getMigratedAdminRole } = require('../services/admin/roleMigrationService');

test('maps legacy admin roles with least privilege', () => {
  assert.equal(getMigratedAdminRole('super_admin'), 'super_admin');
  assert.equal(getMigratedAdminRole('admin'), 'super_admin');
  assert.equal(getMigratedAdminRole('operator'), 'admin');
  assert.equal(getMigratedAdminRole('moderator'), 'user');
  assert.equal(getMigratedAdminRole('analyst'), 'user');
  assert.equal(getMigratedAdminRole('user'), 'user');
});
