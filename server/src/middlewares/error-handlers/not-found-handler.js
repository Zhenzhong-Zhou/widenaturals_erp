/**
 * @file not-found-handler.js
 * @description Middleware for handling 404 errors.
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
};

module.exports = notFoundHandler;
