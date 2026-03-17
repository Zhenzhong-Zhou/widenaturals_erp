const { randomUUID } = require('crypto');

/**
 * UUID v4 validation pattern.
 * Ensures trace IDs follow a consistent and safe format.
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a value is a proper UUID v4 string.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
const isValidTraceId = (value) =>
  typeof value === 'string' && UUID_V4_REGEX.test(value);

/**
 * @typedef {import('express').Request & {
 *   traceId?: string,
 *   startTime?: bigint
 * }} RequestWithTrace
 */

/**
 * Middleware to attach traceId and timing metadata to each request.
 *
 * Responsibilities:
 * - Reuse incoming `x-request-id` header if valid (supports distributed tracing)
 * - Generate a new UUID v4 if no valid traceId is provided
 * - Attach traceId to `req` for downstream logging and tracing
 * - Attach high-resolution `startTime` for request duration measurement
 * - Expose traceId via response headers for client-side debugging
 *
 * Notes:
 * - Validation prevents malformed or malicious trace IDs from polluting logs
 * - Uses `process.hrtime.bigint()` for precise latency tracking
 * - Does NOT perform logging; logging should be handled in a separate middleware
 *
 * @type {import('express').RequestHandler}
 */
const attachTraceId = (req, res, next) => {
  // Read incoming trace ID from upstream systems (if any)
  const incoming = req.get('x-request-id');
  
  // Reuse only if valid UUID v4, otherwise generate a new one
  const traceId = isValidTraceId(incoming)
    ? incoming
    : randomUUID();
  
  // Attach trace ID for use in logging and downstream processing
  req.traceId = traceId;
  
  // Capture high-resolution start time for duration calculation (handled elsewhere)
  req.startTime = process.hrtime.bigint();
  
  // Expose trace ID to client (useful for debugging and support)
  res.setHeader('x-request-id', traceId);
  
  next();
};

module.exports = attachTraceId;
