const express = require('express');
const { getRuntimeLiveOpsConfig } = require('../services/admin/liveOpsService');

const router = express.Router();
router.get('/config', async (_req, res, next) => {
  try {
    const runtime = await getRuntimeLiveOpsConfig();
    res.setHeader('Cache-Control', 'public, max-age=5');
    return res.json({ success: true, data: runtime });
  } catch (error) { return next(error); }
});

module.exports = router;
