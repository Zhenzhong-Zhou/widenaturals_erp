/**
 * @file auth-error-handler.js
 * @description Middleware for handling authentication errors.
 */

const authErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  next(err);
};

module.exports = authErrorHandler;
