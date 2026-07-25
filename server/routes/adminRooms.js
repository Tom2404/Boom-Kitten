const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const {
  listRoomsForAdmin,
  getRoomForAdmin,
  forceCloseRoomForAdmin,
  disconnectRoomPlayerForAdmin,
} = require('../services/admin/roomOperationsService');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function requestContext(req) {
  return { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') };
}

async function sendMutation(req, res, operation, payload, execute) {
  const outcome = await executeIdempotentAdminOperation({
    actorId: req.admin.id,
    operation,
    requestId: req.adminMutation.requestId,
    payload,
    execute,
  });
  if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
  return res.status(outcome.statusCode).json(outcome.body);
}

router.get('/', requireAdminPermission('rooms.read'), (req, res, next) => {
  try {
    const items = listRoomsForAdmin();
    return res.json({ success: true, data: { items, summary: {
      total: items.length,
      waiting: items.filter((room) => room.status === 'waiting').length,
      playing: items.filter((room) => room.status === 'playing').length,
      stale: items.filter((room) => room.stale).length,
    } } });
  } catch (error) { return next(error); }
});

router.get('/:roomCode', requireAdminPermission('rooms.read'), (req, res, next) => {
  try {
    return res.json({ success: true, data: getRoomForAdmin(req.params.roomCode) });
  } catch (error) { return next(error); }
});

router.post('/:roomCode/force-close', requireAdminPermission('rooms.force_close'), requireAdminMutationContext({ critical: true }), async (req, res, next) => {
  try {
    return await sendMutation(req, res, 'room.force_close', {
      roomCode: req.params.roomCode,
      reason: req.adminMutation.reason,
    }, async () => {
      const data = await forceCloseRoomForAdmin({
        roomCode: req.params.roomCode,
        actor: req.admin,
        mutation: req.adminMutation,
        request: requestContext(req),
        io: req.app.get('io'),
      });
      return { statusCode: 200, body: { success: true, data } };
    });
  } catch (error) { return next(error); }
});

router.post('/:roomCode/players/:userId/disconnect', requireAdminPermission('rooms.disconnect'), requireAdminMutationContext({ critical: true }), async (req, res, next) => {
  try {
    return await sendMutation(req, res, 'room.player.disconnect', {
      roomCode: req.params.roomCode,
      userId: req.params.userId,
      reason: req.adminMutation.reason,
    }, async () => {
      const data = await disconnectRoomPlayerForAdmin({
        roomCode: req.params.roomCode,
        userId: req.params.userId,
        actor: req.admin,
        mutation: req.adminMutation,
        request: requestContext(req),
        io: req.app.get('io'),
      });
      return { statusCode: 200, body: { success: true, data } };
    });
  } catch (error) { return next(error); }
});

module.exports = router;
