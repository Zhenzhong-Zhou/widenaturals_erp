/**
 * @file request-logger.js
 * @description Middleware for logging HTTP requests with structured logging and correlation ID support.
 */

const { v4: uuidv4 } = require('uuid');
const {
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');

/**
 * Middleware for logging incoming HTTP requests and responses.
 */
const requestLogger = (req, res, next) => {
  const startTime = process.hrtime(); // Start timer for response time
  const ignoredRoutes = (
    process.env.LOG_IGNORED_ROUTES || `${process.env.API_PREFIX}/public/health`
  ).split(',');

  // Skip logging for ignored routes
  if (ignoredRoutes.includes(req.originalUrl)) {
    return next();
  }
  
  // Set and propagate correlation ID
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  global.traceId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Hook into the response finish event to log details
  res.on('finish', () => {
    const [sec, nano] = process.hrtime(startTime);
    const responseTime = (sec * 1000 + nano / 1e6).toFixed(2);
    
    const statusCode = res.statusCode;
    const logMeta = {
      method: req.method,
      route: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      statusCode,
      responseTime: `${responseTime}ms`,
      queryParams: req.query,
      correlationId,
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
