/**
 * @file trace-id-middleware.js
 * @description Middleware that attaches a trace ID and high-resolution start
 * time to every incoming request.
 *
 * Must be the FIRST middleware registered in the stack so that all subsequent
 * middleware and route handlers have access to `req.traceId` and `req.startTime`.
 */

'use strict';

const { randomUUID } = require('crypto');

// -----------------------------------------------------------------------------
// Trace ID validation
// -----------------------------------------------------------------------------

/**
 * UUID v4 pattern used to validate incoming `x-request-id` headers.
 *
 * Validation prevents log injection — a malicious client could send an
 * arbitrary string as `x-request-id` that pollutes structured logs or
 * breaks log parsers. Only well-formed UUID v4 values are trusted.
 *
 * @type {RegExp}
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns `true` if `value` is a valid UUID v4 string.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
const isValidTraceId = (value) =>
  typeof value === 'string' && UUID_V4_REGEX.test(value);

// -----------------------------------------------------------------------------
// Type definitions
// -----------------------------------------------------------------------------

/**
 * @typedef {import('express').Request & {
 *   traceId:   string,
 *   startTime: bigint
 * }} RequestWithTrace
 */

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

/**
 * Attaches a trace ID and high-resolution start time to the request object.
 *
 * Trace ID resolution:
 *   1. Reuses the incoming `x-request-id` header if it is a valid UUID v4.
 *      This supports distributed tracing where an upstream service has already
 *      assigned a correlation ID.
 *   2. Generates a fresh UUID v4 if the header is absent or fails validation.
 *
 * Attaches:
 *   - `req.traceId`   — string UUID for log correlation across middleware and services
 *   - `req.startTime` — `bigint` from `process.hrtime.bigint()` for sub-millisecond
 *                       latency measurement in `request-logger.js`
 *   - `x-request-id` response header — exposes the trace ID to clients for
 *                       support and debugging
 *
 * @param {RequestWithTrace} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const attachTraceId = (req, res, next) => {
  const incoming = req.get('x-request-id');

  // Reuse upstream trace ID only if it passes UUID v4 validation.
  // An invalid or missing header gets a fresh ID to guarantee log safety.
  req.traceId = isValidTraceId(incoming) ? incoming : randomUUID();
  req.startTime = process.hrtime.bigint();

  // Mirror the trace ID back to the client so it can be included in
  // support requests and correlated with server-side log entries.
  res.setHeader('x-request-id', req.traceId);

  next();
};

module.exports = attachTraceId;
