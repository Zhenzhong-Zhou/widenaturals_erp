const crypto = require('crypto');

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidTraceId = (value) =>
  typeof value === 'string' && UUID_V4_REGEX.test(value);

const traceIdMiddleware = (req, res, next) => {
  const incoming = req.get('x-request-id');

  const traceId = isValidTraceId(incoming) ? incoming : crypto.randomUUID();

  req.traceId = traceId;
  res.setHeader('x-request-id', traceId);

  next();
};

module.exports = traceIdMiddleware;
