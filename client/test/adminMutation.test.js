import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCriticalAdminPayload, buildDeleteAdminPayload, buildRoleChangePayload, buildRoutineAdminPayload, createAdminOperationRequestId } from '../src/pages/admin/adminMutation.js';

test('creates a safe prefixed operation request id', () => {
  assert.equal(createAdminOperationRequestId(() => 'uuid-123'), 'adm_uuid-123');
});

test('builds the critical role-change contract with reason and username confirmation', () => {
  assert.deepEqual(buildRoleChangePayload({
    role: 'operator',
    reason: '  Approved support access  ',
    confirmationUsername: 'root-cat',
    requestId: 'adm_uuid-123',
  }), {
    role: 'operator',
    reason: 'Approved support access',
    requestId: 'adm_uuid-123',
    confirmation: { username: 'root-cat' },
  });
});

test('adds request context to routine and destructive admin payloads', () => {
  assert.deepEqual(buildRoutineAdminPayload({ name: 'Red Frame' }, 'adm_create-1'), {
    name: 'Red Frame',
    requestId: 'adm_create-1',
  });
  assert.deepEqual(buildDeleteAdminPayload('Duplicate catalog entry', 'adm_delete-1'), {
    reason: 'Duplicate catalog entry',
    requestId: 'adm_delete-1',
  });
});

test('builds a generic critical intervention payload with trimmed confirmation', () => {
  assert.deepEqual(buildCriticalAdminPayload({
    reason: '  Stale room blocks matchmaking  ',
    confirmationUsername: '  root-cat  ',
    requestId: 'adm_room-1',
  }), {
    reason: 'Stale room blocks matchmaking',
    requestId: 'adm_room-1',
    confirmation: { username: 'root-cat' },
  });
});
