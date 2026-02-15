/**
 * @file request-logger.js
 * @description Middleware for logging HTTP requests with structured logging and correlation ID support.
 */

const {
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const { getClientIp } = require('../utils/request-context');

/**
 * Middleware for logging incoming HTTP requests and responses.
 */
const requestLogger = (req, res, next) => {
  const startTime = process.hrtime();

  const ignoredRoutes = (
    process.env.LOG_IGNORED_ROUTES || `${process.env.API_PREFIX}/public/health`
  ).split(',');

  // Skip logging for ignored routes
  if (ignoredRoutes.includes(req.originalUrl)) {
    return next();
  }

  const traceId = req.traceId;

  // Hook into the response finish event to log details
  res.on('finish', () => {
    const [sec, nano] = process.hrtime(startTime);
    const responseTime = (sec * 1000 + nano / 1e6).toFixed(2);

    const statusCode = res.statusCode;

    const logMeta = {
      traceId,
      method: req.method,
      route: req.originalUrl,
      ip: getClientIp(req),
      userAgent: req.get('user-agent') || 'Unknown',
      statusCode,
      responseTime: `${responseTime}ms`,
      queryParams: req.query,
    };

    // Redact sensitive fields if needed
    const redact = (body) => {
      if (!body) return undefined;
      const clone = { ...body };
      if (clone.password) clone.password = '***';
      if (clone.token) clone.token = '***';
      return clone;
    };

    const error = res.locals?.error;

    if (statusCode >= 500) {
      if (error) {
        logSystemException(error, 'Internal server error during request', {
          ...logMeta,
          errorType: error?.type || 'UnknownError',
        });
      } else {
        logSystemException(
          new Error('Unknown server error'),
          'Unhandled server error occurred',
          logMeta
        );
      }
    } else if (statusCode >= 400) {
      if (process.env.NODE_ENV === 'development') {
        logMeta.requestBody = redact(req.body);
      }
      logSystemWarn('Client error during request', logMeta);
    } else {
      logSystemInfo('Request handled successfully', logMeta);
    }
  });

  next();
};

module.exports = requestLogger;
