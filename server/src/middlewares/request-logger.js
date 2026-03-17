/**
 * @file request-logger.js
 * @description Middleware for logging HTTP request lifecycle with structured logging.
 *
 * Responsibilities:
 * - Logs all incoming requests after response completion
 * - Measures full request lifecycle duration using high-resolution timing
 * - Classifies logs based on HTTP status (info, warn, exception)
 * - Handles aborted requests separately
 * - Supports traceId-based request correlation
 *
 * Notes:
 * - Requires `attachTraceId` middleware to run BEFORE this middleware
 * - Does NOT mutate request state (read-only middleware)
 * - Uses `process.hrtime.bigint()` for precise latency measurement
 *
 * @type {import('express').RequestHandler}
 */

const {
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const { getClientIp } = require('../utils/request-context');

const SENSITIVE_FIELDS = ['password', 'token'];

/**
 * Redact sensitive fields from a request body for safe logging.
 *
 * Behavior:
 * - Performs a shallow clone of the input object
 * - Masks known sensitive fields (e.g., password, token)
 * - Returns `undefined` if input is falsy
 *
 * Notes:
 * - Only intended for logging (NOT for data sanitization or security enforcement)
 * - Shallow clone only — nested sensitive fields are NOT redacted
 * - Extend this function if additional sensitive keys are introduced
 *
 * @param {any} body - Incoming request body
 * @returns {any} Redacted copy of the body
 */
const redact = (body) => {
  if (!body) return undefined;
  
  const clone = { ...body };
  
  for (const key of SENSITIVE_FIELDS) {
    if (key in clone) {
      clone[key] = '***';
    }
  }
  
  return clone;
};

/**
 * Express middleware for structured HTTP request logging.
 *
 * Responsibilities:
 * - Logs request/response lifecycle events using structured logging
 * - Measures request duration using high-resolution timers
 * - Attaches contextual metadata (traceId, route, IP, user agent, etc.)
 * - Differentiates log severity based on response status:
 *   - 2xx → info
 *   - 4xx → warn
 *   - 5xx → exception
 * - Detects and logs aborted requests via `res.close`
 *
 * Requirements:
 * - Must be used AFTER trace middleware that sets:
 *   - `req.traceId`
 *   - `req.startTime` (process.hrtime.bigint)
 *
 * Notes:
 * - Logging for certain routes can be skipped via `LOG_IGNORED_ROUTES`
 * - Request body is only logged (with redaction) in development mode
 * - Duration is calculated in milliseconds using monotonic clock
 * - Safe against missing `startTime` (skips duration calculation)
 *
 * @type {import('express').RequestHandler}
 */
const requestLogger = (req, res, next) => {
  /** @type {RequestWithTrace} */
  const request = req;
  
  const ignoredRoutes = (
    process.env.LOG_IGNORED_ROUTES ||
    `${process.env.API_PREFIX}/public/health`
  )
    .split(',')
    .map((r) => r.trim());
  
  // Skip logging for health checks or configured routes
  if (ignoredRoutes.includes(request.originalUrl)) {
    return next();
  }
  
  const traceId = request.traceId || 'unknown';
  
  /**
   * Triggered when response is successfully sent
   * → main logging path
   */
  res.on('finish', () => {
    if (!request.startTime) return;
    
    const durationMs =
      Number(process.hrtime.bigint() - request.startTime) / 1_000_000;
    
    const statusCode = res.statusCode;
    
    const logMeta = {
      traceId,
      method: request.method,
      route: request.originalUrl,
      ip: getClientIp(request),
      userAgent: request.get('user-agent') || 'Unknown',
      statusCode,
      durationMs,
      queryParams: request.query,
    };
    
    const error = res.locals?.error;
    
    // Server errors (5xx)
    if (statusCode >= 500) {
      logSystemException(
        error || new Error('Unknown server error'),
        'Internal server error during request',
        {
          ...logMeta,
          errorType: error?.type || 'UnknownError',
        }
      );
      return;
    }
    
    // Client errors (4xx)
    if (statusCode >= 400) {
      if (process.env.NODE_ENV === 'development') {
        logMeta.requestBody = redact(request.body);
      }
      
      logSystemWarn('Client error during request', logMeta);
      return;
    }
    
    // Success (2xx / 3xx)
    logSystemInfo('Request handled successfully', logMeta);
  });
  
  /**
   * Triggered when connection is closed prematurely
   * → client aborted request / network interruption
   */
  res.on('close', () => {
    if (res.writableEnded) return;
    
    const durationMs = request.startTime
      ? Number(process.hrtime.bigint() - request.startTime) / 1_000_000
      : undefined;
    
    logSystemWarn('Request aborted by client', {
      traceId,
      method: request.method,
      route: request.originalUrl,
      ip: getClientIp(request),
      durationMs,
      event: 'aborted',
    });
  });
  
  next();
};

module.exports = requestLogger;
