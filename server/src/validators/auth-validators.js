const AppError = require('../utils/AppError');

/**
 * Middleware to validate authentication inputs.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const validateAuthInputs = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw AppError.validationError('Email and password are required.', {
      code: 'VALIDATION_ERROR',
    });
  }
  
  // Optionally validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw AppError.validationError('Invalid email format.', {
      code: 'INVALID_EMAIL',
    });
  }
  
  next();
};

module.exports = validateAuthInputs;
