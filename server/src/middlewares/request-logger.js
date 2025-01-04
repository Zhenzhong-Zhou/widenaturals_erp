/**
 * @file request-logger.js
 * @description Middleware for logging incoming HTTP requests with additional context.
 */

const { logInfo, logWarn } = require('../utils/loggerHelper');

/**
 * Logs HTTP requests, including method, URL, IP, status code, and response time.
 * Supports customizable ignored routes and environment-based verbosity.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
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
    const logLevel = statusCode >= 500 ? logWarn : (statusCode >= 400 ? logInfo : logInfo); // Dynamic log level
    
    const message = `Request: ${req.method} ${req.originalUrl} from ${req.ip}`;
    const metadata = {
      userAgent: req.headers['user-agent'] || 'Unknown',
      statusCode,
      responseTime: `${responseTime}ms`,
    };
    
    // Add headers or body in development mode
    if (process.env.NODE_ENV === 'development') {
      metadata.headers = req.headers;
    }
    
    logLevel(message, req, metadata);
  });
  
  next();
};

module.exports = requestLogger;
