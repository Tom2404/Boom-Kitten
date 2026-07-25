const express = require('express');
const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { addIncidentNote, sanitizeIncidentForRole, updateIncident } = require('../services/admin/incidentService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function context(req) { return { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') }; }
function assertId(id, field) { if (!mongoose.isValidObjectId(id)) throw new ApiError(422, 'VALIDATION_ERROR', `${field} không hợp lệ.`); }
async function sendMutation(req, res, operation, payload, execute) {
  const outcome = await executeIdempotentAdminOperation({ actorId: req.admin.id, operation, requestId: req.adminMutation.requestId, payload, execute: async () => ({ statusCode: 200, body: { success: true, data: sanitizeIncidentForRole(await execute(), req.admin.role) } }) });
  if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
  return res.status(outcome.statusCode).json(outcome.body);
}

router.get('/', requireAdminPermission('incidents.read'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = {};
    if (['open', 'acknowledged', 'resolved'].includes(req.query.status)) filter.status = req.query.status;
    if (['low', 'medium', 'high', 'critical'].includes(req.query.severity)) filter.severity = req.query.severity;
    if (['room_stale', 'admin_error_rate', 'job_failed', 'announcement_overdue'].includes(req.query.type)) filter.type = req.query.type;
    if (req.query.assignee === 'me') filter.assigneeId = req.admin.id; else if (req.query.assignee === 'unassigned') filter.assigneeId = null;
    const [items, total] = await Promise.all([Incident.find(filter).sort({ lastSeenAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).populate('assigneeId', 'username role').lean(), Incident.countDocuments(filter)]);
    return res.json({ success: true, data: { items: items.map((item) => sanitizeIncidentForRole(item, req.admin.role)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) { return next(error); }
});

router.get('/:id', requireAdminPermission('incidents.read'), async (req, res, next) => {
  try { assertId(req.params.id, 'incidentId'); const incident = await Incident.findById(req.params.id).populate('assigneeId', 'username role').lean(); if (!incident) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy incident.'); return res.json({ success: true, data: sanitizeIncidentForRole(incident, req.admin.role) }); }
  catch (error) { return next(error); }
});

router.patch('/:id', requireAdminPermission('incidents.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    assertId(req.params.id, 'incidentId');
    if (req.body.assigneeId) { assertId(req.body.assigneeId, 'assigneeId'); const assignee = await User.findById(req.body.assigneeId).select('role').lean(); if (!assignee || !['admin', 'super_admin', 'operator', 'moderator'].includes(assignee.role)) throw new ApiError(422, 'VALIDATION_ERROR', 'Assignee phải là tài khoản quản trị có quyền xử lý incident.'); }
    const payload = { incidentId: req.params.id, status: req.body.status, assigneeId: req.body.assigneeId, expectedVersion: req.body.expectedVersion };
    return await sendMutation(req, res, 'incident.update', payload, () => updateIncident({ actor: req.admin, incidentId: req.params.id, input: req.body, mutation: req.adminMutation, request: context(req) }));
  } catch (error) { return next(error); }
});

router.post('/:id/notes', requireAdminPermission('incidents.write'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try { assertId(req.params.id, 'incidentId'); const payload = { incidentId: req.params.id, body: req.body.body, expectedVersion: req.body.expectedVersion }; return await sendMutation(req, res, 'incident.note.add', payload, () => addIncidentNote({ actor: req.admin, incidentId: req.params.id, body: req.body.body, expectedVersion: req.body.expectedVersion, mutation: { ...req.adminMutation, reason: req.adminMutation.reason || 'Internal incident note' }, request: context(req) })); }
  catch (error) { return next(error); }
});

module.exports = router;
