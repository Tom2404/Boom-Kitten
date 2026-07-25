const express = require('express');
const LiveOpsConfig = require('../models/LiveOpsConfig');
const LiveOpsState = require('../models/LiveOpsState');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { createLiveOpsDraft, publishLiveOpsConfig, rollbackLiveOpsConfig, validateLiveOpsDraft } = require('../services/admin/liveOpsService');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function context(req) { return { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') }; }

async function mutation(req, res, operation, payload, execute, statusCode = 200) {
  const outcome = await executeIdempotentAdminOperation({ actorId: req.admin.id, operation, requestId: req.adminMutation.requestId, payload, execute: async () => ({ statusCode, body: { success: true, data: await execute() } }) });
  if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
  return res.status(outcome.statusCode).json(outcome.body);
}

router.get('/configs', requireAdminPermission('live_ops.read'), async (_req, res, next) => {
  try {
    const [items, state] = await Promise.all([LiveOpsConfig.find().sort({ version: -1 }).limit(100).lean(), LiveOpsState.findOne({ key: 'global' }).lean()]);
    return res.json({ success: true, data: { items, state: state || { activeVersion: 0, stateVersion: 0 } } });
  } catch (error) { return next(error); }
});

router.post('/configs', requireAdminPermission('live_ops.draft'), requireAdminMutationContext(), async (req, res, next) => {
  try { return await mutation(req, res, 'live_ops.draft.create', req.body, () => createLiveOpsDraft({ actor: req.admin, config: req.body.config, mutation: req.adminMutation, request: context(req) }), 201); }
  catch (error) { return next(error); }
});

router.post('/configs/:id/validate', requireAdminPermission('live_ops.draft'), requireAdminMutationContext(), async (req, res, next) => {
  try { return await mutation(req, res, 'live_ops.draft.validate', { configId: req.params.id, expectedVersion: req.body.expectedVersion }, () => validateLiveOpsDraft({ actor: req.admin, configId: req.params.id, expectedVersion: req.body.expectedVersion, mutation: req.adminMutation, request: context(req) })); }
  catch (error) { return next(error); }
});

router.post('/configs/:id/publish', requireAdminPermission('live_ops.publish'), requireAdminMutationContext({ critical: true }), async (req, res, next) => {
  try { return await mutation(req, res, 'live_ops.config.publish', { configId: req.params.id, expectedVersion: req.body.expectedVersion, expectedStateVersion: req.body.expectedStateVersion }, () => publishLiveOpsConfig({ actor: req.admin, configId: req.params.id, expectedVersion: req.body.expectedVersion, expectedStateVersion: req.body.expectedStateVersion, mutation: req.adminMutation, request: context(req) })); }
  catch (error) { return next(error); }
});

router.post('/configs/:id/rollback', requireAdminPermission('live_ops.rollback'), requireAdminMutationContext({ critical: true }), async (req, res, next) => {
  try { return await mutation(req, res, 'live_ops.config.rollback', { configId: req.params.id, targetVersion: req.body.targetVersion, expectedStateVersion: req.body.expectedStateVersion }, () => rollbackLiveOpsConfig({ actor: req.admin, targetVersion: req.body.targetVersion, expectedStateVersion: req.body.expectedStateVersion, mutation: req.adminMutation, request: context(req) }), 201); }
  catch (error) { return next(error); }
});

module.exports = router;
