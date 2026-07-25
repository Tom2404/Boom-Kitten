const { randomUUID } = require('node:crypto');

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function createRequestContextMiddleware({ generateId = randomUUID } = {}) {
  return function requestContextMiddleware(req, res, next) {
    const providedId = req.get('X-Request-Id');
    req.requestId = SAFE_REQUEST_ID.test(providedId || '') ? providedId : generateId();
    res.setHeader('X-Request-Id', req.requestId);
    return next();
  };
}

module.exports = createRequestContextMiddleware();
module.exports.createRequestContextMiddleware = createRequestContextMiddleware;
