/**
 * @file request-logger.js
 * @description Middleware for logging HTTP requests with enhanced non-2xx response handling.
 */

const { logWithLevel } = require('../utils/logger-helper');
const AppError = require('../utils/app-error');

/**
 * Middleware for logging incoming HTTP requests and responses.
 */
const requestLogger = (req, res, next) => {
  const startTime = process.hrtime(); // Start timer for response time
  const ignoredRoutes = ['/health']; // Routes to skip logging
  
  // Skip logging for ignored routes
  if (ignoredRoutes.includes(req.originalUrl)) return next();
  
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
      userAgent: req.headers['user-agent'] || 'Unknown',
      queryParams: req.query,
    };
    
    // Include request body for client errors in development mode
    if (isClientError && process.env.NODE_ENV === 'development') {
      metadata.requestBody = req.body;
    }
    
    // Include error details for server errors
    if (isServerError) {
      const error = res.locals.error || new AppError('Unknown server error', 500, { type: 'ServerError' });
      metadata.error = error.toJSON();
    }
    
    logWithLevel(logLevel, message, metadata);
  });
  
  next();
};

module.exports = requestLogger;
