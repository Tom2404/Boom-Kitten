const test = require('node:test');
const assert = require('node:assert/strict');

const { requireAdminMutationContext } = require('../middleware/adminMutationContext');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('rejects a sensitive mutation without reason and operation request id', () => {
  const middleware = requireAdminMutationContext();
  const req = { body: {}, admin: { username: 'root-cat' }, requestId: 'transport-1' };
  const res = createResponse();

  middleware(req, res, () => assert.fail('invalid mutation must not continue'));

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.deepEqual(res.body.error.details.fields, {
    reason: 'Bắt buộc',
    requestId: 'Bắt buộc',
  });
});

test('requires the current admin username for a critical mutation', () => {
  const middleware = requireAdminMutationContext({ critical: true });
  const req = {
    body: {
      reason: 'Promote support operator',
      requestId: 'role-change-1',
      confirmation: { username: 'someone-else' },
    },
    admin: { username: 'root-cat' },
    requestId: 'transport-1',
  };
  const res = createResponse();

  middleware(req, res, () => assert.fail('wrong confirmation must not continue'));

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.error.code, 'ADMIN_CONFIRMATION_REQUIRED');
  assert.equal(res.body.error.details.fields['confirmation.username'], 'Không khớp username hiện tại');
});

test('normalizes valid mutation context for audit and idempotency', () => {
  const middleware = requireAdminMutationContext({ critical: true });
  const req = {
    body: {
      reason: '  Promote support operator  ',
      requestId: 'role-change-1',
      confirmation: { username: 'root-cat' },
    },
    admin: { username: 'root-cat' },
  };
  const res = createResponse();
  let continued = false;

  middleware(req, res, () => { continued = true; });

  assert.equal(continued, true);
  assert.deepEqual(req.adminMutation, {
    reason: 'Promote support operator',
    requestId: 'role-change-1',
    confirmationUsername: 'root-cat',
    critical: true,
  });
});

test('can require only requestId for routine audited mutations', () => {
  const middleware = requireAdminMutationContext({ reasonRequired: false });
  const req = { body: { requestId: 'catalog-create-1' }, admin: { username: 'operator-cat' } };
  const res = createResponse();
  let continued = false;

  middleware(req, res, () => { continued = true; });

  assert.equal(continued, true);
  assert.deepEqual(req.adminMutation, {
    reason: '',
    requestId: 'catalog-create-1',
    confirmationUsername: undefined,
    critical: false,
  });
});
