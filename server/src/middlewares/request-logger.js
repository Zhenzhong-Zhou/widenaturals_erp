/**
 * @file request-logger.js
 * @description Middleware for logging HTTP requests with enhanced non-2xx response handling.
 */

const { logWithLevel } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware for logging incoming HTTP requests and responses.
 */
const requestLogger = (req, res, next) => {
  const startTime = process.hrtime(); // Start timer for response time
  const ignoredRoutes = (process.env.LOG_IGNORED_ROUTES || `${process.env.API_PREFIX}/public/health`).split(',');
  
  // Skip logging for ignored routes
  if (ignoredRoutes.includes(req.originalUrl)) {
    return next();
  }
  
  // Generate a correlation ID
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Hook into the response finish event to log details
  res.on('finish', () => {
    const duration = process.hrtime(startTime);
    const responseTime = (duration[0] * 1e3 + duration[1] * 1e-6).toFixed(2); // Convert to ms
    
    const statusCode = res.statusCode;
    const isClientError = statusCode >= 400 && statusCode < 500;
    const isServerError = statusCode >= 500;
    
    const logLevel = isServerError ? 'error' : isClientError ? 'warn' : 'info';
    const message = `Request: ${req.method} ${req.originalUrl} from ${req.ip}`;
    const metadata = {
      statusCode,
      responseTime: `${responseTime}ms`,
      method: req.method,
      route: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
      queryParams: req.query,
      correlationId,
    };
    
    // Redact sensitive fields in request body for client errors
    const redactSensitiveFields = (body) => {
      const redacted = { ...body };
      if (redacted.password) redacted.password = '***';
      if (redacted.token) redacted.token = '***';
      return redacted;
    };
    
    // Include request body for client errors in development mode
    if (isClientError && process.env.NODE_ENV === 'development') {
      metadata.requestBody = redactSensitiveFields(req.body);
    }
    
    // Include error details for server errors
    const error = res.locals.error;
    if (error) {
      if (error instanceof AppError) {
        // Use AppError's structure
        metadata.error = {
          message: error.message,
          status: error.status,
          type: error.type,
          code: error.code,
          isExpected: error.isExpected,
          details: process.env.NODE_ENV !== 'production' ? error.details : undefined, // Hide details in production
        };
      } else {
        // Fallback for non-AppError errors
        metadata.error = {
          message: error.message || 'Unknown error',
          status: statusCode,
          type: 'UnknownError',
          code: 'UNKNOWN_ERROR',
          isExpected: false,
          details: process.env.NODE_ENV !== 'production' ? error.stack : undefined, // Hide stack in production
        };
      }
    }
    
    logWithLevel(logLevel, message, metadata);
  });
  
  next();
};

module.exports = requestLogger;
