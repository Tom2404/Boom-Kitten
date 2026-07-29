import test from 'node:test';
import assert from 'node:assert/strict';

import { isAdminRole } from '../src/utils/adminRoles.js';

test('recognizes only the two approved admin roles', () => {
  for (const role of ['admin', 'super_admin']) {
    assert.equal(isAdminRole(role), true, `${role} must enter the Admin console`);
  }
});

test('does not grant Admin navigation to regular or unknown roles', () => {
  for (const role of ['user', 'operator', 'moderator', 'analyst', '', undefined, null, 'unknown']) {
    assert.equal(isAdminRole(role), false);
  }
});
