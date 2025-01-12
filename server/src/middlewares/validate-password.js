const AppError = require('../utils/AppError');
const validatePassword = require('../validators/password-validators');
const checkPasswordStrength = require('../utils/check-password-strength');
const { logError } = require('../utils/logger-helper');

/**
 * Middleware to validate and check the strength of a password.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const passwordValidationMiddleware = (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      throw AppError.validationError('Password is required.', {
        details: [
          { message: 'Password field is missing.', path: ['password'] },
        ],
      });
    }

    // Validate password structure using Joi schema
    const { error } = validatePassword.validate(password);
    if (error) {
      const errorDetails = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path.join('.'), // Flatten path for readability
      }));

      logError('Password Validation Error:', {
        details: errorDetails,
        route: req.originalUrl,
        method: req.method,
      });

      throw AppError.validationError('Invalid password format.', {
        details: errorDetails,
      });
    }

    // Check password strength using zxcvbn
    const strengthResult = checkPasswordStrength(password);
    if (strengthResult.score < 3) {
      const feedback = {
        score: strengthResult.score,
        strength: strengthResult.strength,
        feedback: strengthResult.feedback,
      };

      logError('Password Strength Error:', {
        feedback,
        route: req.originalUrl,
        method: req.method,
      });

      throw AppError.validationError('Password is too weak.', {
        details: feedback,
        type: 'PasswordStrengthError',
      });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
};

module.exports = passwordValidationMiddleware;
