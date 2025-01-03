/**
 * @file db-error-handler.js
 * @description Middleware for handling database-related errors.
 */

const dbErrorHandler = (err, req, res, next) => {
  if (err.code === '23505') { // Example: Unique constraint violation
    return res.status(400).json({ error: 'Duplicate entry detected' });
  }
  next(err);
};

module.exports = dbErrorHandler;
