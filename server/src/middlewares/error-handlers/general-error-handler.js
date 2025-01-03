/**
 * @file general-error-handler.js
 * @description Middleware for handling unexpected or global errors.
 */

const generalErrorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = generalErrorHandler;
