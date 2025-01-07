const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle validation errors.
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    logError(`Validation Error: ${err.message}`, {
      method: req.method,
      url: req.originalUrl,
      details: err.details || null,
    });
    
    return res.status(400).json({
      error: 'ValidationError',
      message: err.message,
      details: err.details || 'Validation failed.',
    });
  }
  
  next(err);
};

module.exports = validationErrorHandler;
