const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { getProductAnalytics } = require('../services/admin/productAnalyticsService');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/product', requireAdminPermission('analytics.read'), async (req, res, next) => {
  try {
    const data = await getProductAnalytics({ query: req.query });
    return res.json({ success: true, data });
  } catch (error) { return next(error); }
});

module.exports = router;
