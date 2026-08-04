const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Report = require('../models/Report');
const ModerationCase = require('../models/ModerationCase');
const { createPlayerReport } = require('../services/moderationService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware);

router.post('/', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.body?.targetPlayerId)) throw new ApiError(422, 'VALIDATION_ERROR', 'Người chơi không hợp lệ.');
    const result = await createPlayerReport({
      reporterId: req.user.id,
      input: req.body,
      UserModel: User,
      ReportModel: Report,
      ModerationCaseModel: ModerationCase,
    });
    return res.status(201).json({ success: true, data: { reportId: result.report._id, caseId: result.moderationCase._id } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
