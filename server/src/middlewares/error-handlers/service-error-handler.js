/**
 * Middleware to handle service-level errors.
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const serviceErrorHandler = (err, req, res, next) => {
  if (err.name === 'ServiceError') {
    return res.status(400).json({
      error: 'Business Logic Error',
      message: err.message || 'A business rule was violated.',
    });
  }
  next(err);
};

module.exports = serviceErrorHandler;
