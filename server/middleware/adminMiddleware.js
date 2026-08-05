const User = require('../models/User');
const { getAccountRestriction } = require('../utils/accountStatus');
const { getAdminCapabilities, getAdminPolicy, normalizeAdminRole } = require('../utils/adminPermissions');
const { sendApiError } = require('../utils/apiResponse');

function createAdminMiddleware({ UserModel = User } = {}) {
  return async function adminMiddleware(req, res, next) {
    try {
      const currentUser = req.user?.id
        ? await UserModel.findById(req.user.id).select('_id username email role isBanned suspendedUntil')
        : null;

      if (!currentUser) {
        return sendApiError(
          res,
          403,
          'ADMIN_PERMISSION_DENIED',
          'Bạn không có quyền truy cập khu vực quản trị.',
          { requestId: req.requestId },
        );
      }

      if (getAccountRestriction(currentUser)) {
        return sendApiError(
          res,
          403,
          'ADMIN_ACCOUNT_DISABLED',
          'Tài khoản quản trị đã bị vô hiệu hóa.',
          { requestId: req.requestId },
        );
      }

      const role = normalizeAdminRole(currentUser.role);
      const permissions = getAdminCapabilities(role);
      if (permissions.length === 0) {
        return sendApiError(
          res,
          403,
          'ADMIN_PERMISSION_DENIED',
          'Bạn không có quyền truy cập khu vực quản trị.',
          { requestId: req.requestId },
        );
      }

      req.user = { ...req.user, role };
      req.admin = {
        id: currentUser._id.toString(),
        username: currentUser.username,
        email: currentUser.email,
        role,
        permissions,
        policy: getAdminPolicy(role),
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function requireAdminPermission(permission) {
  return function adminPermissionMiddleware(req, res, next) {
    if (!req.admin?.permissions?.includes(permission)) {
      return sendApiError(
        res,
        403,
        'ADMIN_PERMISSION_DENIED',
        'Bạn không có quyền thực hiện thao tác này.',
        { details: { permission }, requestId: req.requestId },
      );
    }
    return next();
  };
}

function requireAnyAdminPermission(...permissions) {
  return function adminPermissionMiddleware(req, res, next) {
    const hasAny = permissions.some((p) => req.admin?.permissions?.includes(p));
    if (!hasAny) {
      return sendApiError(
        res,
        403,
        'ADMIN_PERMISSION_DENIED',
        'Bạn không có quyền thực hiện thao tác này.',
        { details: { permissions }, requestId: req.requestId },
      );
    }
    return next();
  };
}

const adminMiddleware = createAdminMiddleware();

module.exports = adminMiddleware;
module.exports.createAdminMiddleware = createAdminMiddleware;
module.exports.requireAdminPermission = requireAdminPermission;
module.exports.requireAnyAdminPermission = requireAnyAdminPermission;
