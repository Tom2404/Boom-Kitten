import test from 'node:test';
import assert from 'node:assert/strict';

import { isAdminRole } from '../src/utils/adminRoles.js';

test('recognizes every approved admin role and the legacy migration role', () => {
  for (const role of ['admin', 'super_admin', 'operator', 'moderator', 'analyst']) {
    assert.equal(isAdminRole(role), true, `${role} must enter the Admin console`);
  }
});

test('does not grant Admin navigation to regular or unknown roles', () => {
  for (const role of ['user', '', undefined, null, 'unknown']) {
    assert.equal(isAdminRole(role), false);
  }
});
