/**
 * Middleware to handle authorization errors.
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authorizationErrorHandler = (err, req, res, next) => {
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message || 'You are not authorized to perform this action.',
    });
  }
  next(err);
};

module.exports = authorizationErrorHandler;
