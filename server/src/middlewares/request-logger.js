/**
 * @file request-logger.js
 * @description Express middleware for structured HTTP request lifecycle logging.
 *
 * Responsibilities:
 *   - Log completed requests with status classification (2xx/3xx, 4xx, 5xx)
 *   - Log aborted requests with partial duration
 *   - Measure latency using high-resolution timer (`process.hrtime.bigint`)
 *   - Mask sensitive request body fields in development logs
 *
 * Design:
 *   - Read-only — does not mutate req or res
 *   - Ignored routes are resolved once at module load, not per request
 *   - Delegates masking to `maskSensitiveParams` (no inline masking logic)
 *   - Does NOT log error objects for 5xx responses — errors are already
 *     normalized and logged once by the error handler pipeline. This middleware
 *     only logs request metadata (route, status, duration, client context).
 *
 * Dependencies:
 *   - `attachTraceId` middleware MUST run before this middleware so that
 *     `req.traceId` and `req.startTime` are present on every request.
 *
 * Log level by status:
 *   - 5xx → `logError`  (server fault — request metadata only, no error object)
 *   - 4xx → `logWarn`   (client fault — masked body included in development)
 *   - 2xx/3xx → `logInfo`
 *   - aborted → `logWarn`
 */

'use strict';

const {
  logInfo,
  logWarn,
  logError,
} = require('../utils/logging/logger-helper');
const { extractRequestContext } = require('../utils/request-context');
const {
  maskSensitiveParams,
} = require('../utils/masking/mask-sensitive-params');

const CONTEXT = 'middleware/request-logger';
const isDev = process.env.NODE_ENV === 'development';

// -----------------------------------------------------------------------------
// Ignored routes — resolved once at module load
// Rebuilding this on every request would split and trim the env var string
// thousands of times per minute under normal traffic.
// -----------------------------------------------------------------------------

/**
 * Set of URL paths that bypass request logging entirely.
 * Defaults to the health endpoint if LOG_IGNORED_ROUTES is not set.
 *
 * @type {Set<string>}
 */
const IGNORED_ROUTES = new Set(
  (process.env.LOG_IGNORED_ROUTES || `${process.env.API_PREFIX}/public/health`)
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
);

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

/**
 * Computes elapsed milliseconds since `req.startTime` (set by attachTraceId).
 * Returns `undefined` if `startTime` is not present on the request.
 *
 * @param {import('express').Request & { startTime?: bigint }} req
 * @returns {number | undefined}
 */
const getDurationMs = (req) =>
  req.startTime
    ? Number(process.hrtime.bigint() - req.startTime) / 1_000_000
    : undefined;

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

/**
 * Attaches `finish` and `close` listeners to log the outcome of every
 * non-ignored request after the response is sent or the connection is dropped.
 *
 * Errors are NOT re-logged here for 5xx responses — the error handler pipeline
 * (specific handlers + globalErrorHandler) already normalized and logged each
 * error once. This middleware logs request-level metadata only, keeping each
 * error to a single log entry regardless of response status.
 *
 * @param {import('express').Request & { startTime?: bigint }} req
 * @param {import('express').Response}                         res
 * @param {import('express').NextFunction}                     next
 * @returns {void}
 */
const requestLogger = (req, res, next) => {
  // Skip logging entirely for ignored routes (e.g. health check).
  // Load balancer and uptime monitor polling would otherwise flood logs.
  if (IGNORED_ROUTES.has(req.originalUrl)) {
    next();
    return;
  }

  // ---------------------------------------------------------------------------
  // finish — response fully sent
  // Fires after res.end() completes and all data has been flushed.
  // ---------------------------------------------------------------------------
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const durationMs = getDurationMs(req);
    const requestContext = extractRequestContext(req);

    const logMeta = {
      ...requestContext,
      context: CONTEXT,
      statusCode,
      durationMs,
    };

    // 5xx — server fault.
    // Log request metadata only — the error itself was already normalized and
    // logged once by globalErrorHandler. Logging it again here would create
    // duplicate entries for every 5xx response.
    if (statusCode >= 500) {
      logError('Server error response', req, logMeta);
      return;
    }

    // 4xx — client fault.
    // Include the masked request body in development to aid debugging of
    // validation and auth errors without risking credential exposure in prod.
    if (statusCode >= 400) {
      if (isDev) {
        logMeta.requestBody = maskSensitiveParams(req.body);
      }

      logWarn('Client error response', req, logMeta);
      return;
    }

    // 2xx / 3xx — success or redirect.
    logInfo('Request completed', req, logMeta);
  });

  // ---------------------------------------------------------------------------
  // close — connection dropped before response was fully sent.
  // writableEnded being true means the response finished normally and the
  // 'finish' event already fired — guard against double-logging.
  // ---------------------------------------------------------------------------
  res.on('close', () => {
    if (res.writableEnded) return;

    logWarn('Request aborted by client', req, {
      ...extractRequestContext(req),
      context: CONTEXT,
      durationMs: getDurationMs(req),
      event: 'aborted',
    });
  });

  next();
};

module.exports = requestLogger;
