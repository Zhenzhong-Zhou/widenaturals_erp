const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle sanitization errors.
 */
const sanitizationErrorHandler = (err, req, res, next) => {
  if (err.name === 'SanitizationError') {
    logError(`Sanitization Error: ${err.message}`, {
      method: req.method,
      url: req.originalUrl,
      details: err.details || null,
    });
    
    return res.status(400).json({
      error: 'SanitizationError',
      message: err.message,
      details: err.details || 'Sanitization failed.',
    });
  }
  
  next(err);
};

module.exports = sanitizationErrorHandler;
