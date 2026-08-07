// Sanitizes request inputs against MongoDB NoSQL injection primitives ($ and .).

function sanitizeValue(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  const sanitized = {};
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Strip key to prevent operator injection
    }
    sanitized[key] = sanitizeValue(value[key]);
  }
  return sanitized;
}

function mongoSanitize(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

module.exports = mongoSanitize;
