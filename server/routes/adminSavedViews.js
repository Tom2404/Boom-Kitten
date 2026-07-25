const express = require('express');
const AdminSavedView = require('../models/AdminSavedView');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { createAdminAudit } = require('../services/admin/auditService');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { getSavedViewScopePermission, normalizeSavedViewFilters, sanitizeSavedViewName } = require('../services/admin/savedViewService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function ensureScopeAccess(req, scope) {
  const permission = getSavedViewScopePermission(scope);
  if (!req.admin.permissions.includes(permission)) throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Bạn không có quyền dùng saved view cho khu vực này.', { permission });
}

function requestAuditContext(req) {
  return { operationRequestId: req.adminMutation.requestId, requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') };
}

router.get('/', async (req, res, next) => {
  try {
    ensureScopeAccess(req, req.query.scope);
    const items = await AdminSavedView.find({ ownerId: req.admin.id, scope: req.query.scope }).sort({ updatedAt: -1, _id: -1 }).lean();
    return res.json({ success: true, data: { items } });
  } catch (error) { return next(error); }
});

router.post('/', requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    ensureScopeAccess(req, req.body.scope);
    const name = sanitizeSavedViewName(req.body.name);
    const filters = normalizeSavedViewFilters(req.body.scope, req.body.filters || {}, req.body.schemaVersion ?? 1);
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'admin_saved_view.create',
      requestId: req.adminMutation.requestId,
      payload: { scope: req.body.scope, name, filters },
      execute: async () => {
        const view = await AdminSavedView.create({ ownerId: req.admin.id, scope: req.body.scope, name, filters, schemaVersion: 1 });
        await createAdminAudit({ actor: req.admin, action: 'ADMIN_SAVED_VIEW_CREATED', target: { type: 'admin_saved_view', id: String(view._id) }, before: null, after: { scope: view.scope, name: view.name, filters: view.filters }, reason: 'Saved view preference created', request: requestAuditContext(req) });
        return { statusCode: 201, body: { success: true, data: view } };
      },
    });
    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) {
    if (error?.code === 11000) return next(new ApiError(409, 'STATE_CONFLICT', 'Tên saved view đã tồn tại trong khu vực này.'));
    return next(error);
  }
});

router.patch('/:viewId', requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    ensureScopeAccess(req, req.body.scope);
    const nextName = req.body.name === undefined ? undefined : sanitizeSavedViewName(req.body.name);
    const nextFilters = req.body.filters === undefined ? undefined : normalizeSavedViewFilters(req.body.scope, req.body.filters, req.body.schemaVersion ?? 1);
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'admin_saved_view.update',
      requestId: req.adminMutation.requestId,
      payload: { viewId: req.params.viewId, scope: req.body.scope, name: nextName, filters: nextFilters, version: req.body.version },
      execute: async () => {
        const before = await AdminSavedView.findOne({ _id: req.params.viewId, ownerId: req.admin.id, scope: req.body.scope });
        if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy saved view thuộc tài khoản hiện tại.');
        const set = { schemaVersion: 1, ...(nextName !== undefined && { name: nextName }), ...(nextFilters !== undefined && { filters: nextFilters }) };
        const view = await AdminSavedView.findOneAndUpdate({ _id: before._id, ownerId: req.admin.id, __v: Number(req.body.version) }, { $set: set, $inc: { __v: 1 } }, { new: true, runValidators: true });
        if (!view) throw new ApiError(409, 'STATE_CONFLICT', 'Saved view đã thay đổi. Hãy tải lại.');
        await createAdminAudit({ actor: req.admin, action: 'ADMIN_SAVED_VIEW_UPDATED', target: { type: 'admin_saved_view', id: String(view._id) }, before: { name: before.name, filters: before.filters }, after: { name: view.name, filters: view.filters }, reason: 'Saved view preference updated', request: requestAuditContext(req) });
        return { statusCode: 200, body: { success: true, data: view } };
      },
    });
    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) { return next(error); }
});

router.delete('/:viewId', requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    ensureScopeAccess(req, req.body.scope);
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'admin_saved_view.delete',
      requestId: req.adminMutation.requestId,
      payload: { viewId: req.params.viewId, scope: req.body.scope, version: req.body.version },
      execute: async () => {
        const view = await AdminSavedView.findOneAndDelete({ _id: req.params.viewId, ownerId: req.admin.id, scope: req.body.scope, __v: Number(req.body.version) });
        if (!view) throw new ApiError(409, 'STATE_CONFLICT', 'Saved view đã thay đổi. Hãy tải lại.');
        await createAdminAudit({ actor: req.admin, action: 'ADMIN_SAVED_VIEW_DELETED', target: { type: 'admin_saved_view', id: String(view._id) }, before: { scope: view.scope, name: view.name, filters: view.filters }, after: null, reason: 'Saved view preference deleted', request: requestAuditContext(req) });
        return { statusCode: 200, body: { success: true, data: { id: String(view._id) } } };
      },
    });
    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) { return next(error); }
});

module.exports = router;
