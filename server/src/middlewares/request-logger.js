/**
 * @file request-logger.js
 * @description Middleware for structured HTTP request lifecycle logging.
 *
 * Responsibilities:
 * - Logs requests after response completion
 * - Measures latency using high-resolution timer
 * - Classifies logs by HTTP status
 * - Handles aborted requests
 * - Ensures sensitive data is masked via centralized masking pipeline
 *
 * Design:
 * - Read-only middleware (no mutation of req/res)
 * - Uses centralized masking (maskSensitiveParams)
 * - Avoids duplicate masking logic
 *
 * @type {import('express').RequestHandler}
 */

const {
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const { extractRequestContext } = require('../utils/request-context');
const { normalizeAppError } = require('../utils/errors/error-normalizer');
const { maskSensitiveParams } = require('../utils/mask-sensitive-params');

/**
 * Express middleware for structured HTTP request logging.
 *
 * Requirements:
 * - attachTraceId middleware must run BEFORE this middleware
 *
 * Behavior:
 * - Logs after response is completed (`finish`)
 * - Logs aborted requests (`close`)
 * - Uses centralized masking for request body (dev only)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
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
  
  if (ignoredRoutes.includes(request.originalUrl)) {
    return next();
  }
  
  // =========================
  // Response completed
  // =========================
  res.on('finish', () => {
    if (!request.startTime) return;
    
    const durationMs =
      Number(process.hrtime.bigint() - request.startTime) / 1_000_000;
    
    const statusCode = res.statusCode;
    const requestContext = extractRequestContext(request);
    
    const logMeta = {
      ...requestContext,
      statusCode,
      durationMs,
    };
    
    const error = res.locals?.error;
    const normalizedError = error ? normalizeAppError(error) : null;
    
    // =========================
    // Server error (5xx)
    // =========================
    if (statusCode >= 500) {
      logSystemException(
        normalizedError || new Error('Unknown server error'),
        'Internal server error during request',
        logMeta
      );
      return;
    }
    
    // =========================
    // Client error (4xx)
    // =========================
    if (statusCode >= 400) {
      if (process.env.NODE_ENV === 'development') {
        // Use centralized masking (deep + consistent)
        logMeta.requestBody = maskSensitiveParams(request.body);
      }
      
      logSystemWarn('Client error during request', logMeta);
      return;
    }
    
    // =========================
    // Success (2xx / 3xx)
    // =========================
    logSystemInfo('Request handled successfully', logMeta);
  });
  
  // =========================
  // Aborted request
  // =========================
  res.on('close', () => {
    if (res.writableEnded) return;
    
    const durationMs = request.startTime
      ? Number(process.hrtime.bigint() - request.startTime) / 1_000_000
      : undefined;
    
    const requestContext = extractRequestContext(request);
    
    logSystemWarn('Request aborted by client', {
      ...requestContext,
      durationMs,
      event: 'aborted',
    });
  });
  
  next();
};

module.exports = requestLogger;
