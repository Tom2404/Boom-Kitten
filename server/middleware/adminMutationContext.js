const { sendApiError } = require('../utils/apiResponse');

const SAFE_OPERATION_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function requireAdminMutationContext({ critical = false, reasonRequired = true } = {}) {
  return function adminMutationContextMiddleware(req, res, next) {
    const headerReason = typeof req.headers?.['x-admin-reason'] === 'string' ? req.headers['x-admin-reason'].trim() : '';
    const headerRequestId = typeof req.headers?.['x-operation-request-id'] === 'string' ? req.headers['x-operation-request-id'].trim() : '';

    const reason = (typeof req.body?.reason === 'string' ? req.body.reason.trim() : '') || headerReason;
    const operationRequestId = (typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : '') || headerRequestId;
    const fields = {};

    if (reasonRequired && !reason) fields.reason = 'Bắt buộc';
    else if (reason.length > 500) fields.reason = 'Tối đa 500 ký tự';
    if (!operationRequestId) fields.requestId = 'Bắt buộc';
    else if (!SAFE_OPERATION_REQUEST_ID.test(operationRequestId)) fields.requestId = 'Định dạng không hợp lệ';

    if (Object.keys(fields).length > 0) {
      return sendApiError(res, 422, 'VALIDATION_ERROR', 'Thiếu ngữ cảnh cho thao tác quản trị.', {
        details: { fields },
        requestId: req.requestId,
      });
    }

    const confirmationUsername = typeof req.body?.confirmation?.username === 'string'
      ? req.body.confirmation.username.trim()
      : '';
    if (critical && confirmationUsername !== req.admin?.username) {
      return sendApiError(res, 422, 'ADMIN_CONFIRMATION_REQUIRED', 'Hãy nhập đúng username quản trị hiện tại để xác nhận.', {
        details: { fields: { 'confirmation.username': 'Không khớp username hiện tại' } },
        requestId: req.requestId,
      });
    }

    req.adminMutation = {
      reason,
      requestId: operationRequestId,
      confirmationUsername: critical ? confirmationUsername : undefined,
      critical,
    };
    return next();
  };
}

module.exports = { requireAdminMutationContext };
