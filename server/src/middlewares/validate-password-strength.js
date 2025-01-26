const checkPasswordStrength = require('../utils/check-password-strength');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Middleware to validate the strength of a new password in the request body.
 *
 * This middleware checks if the provided password meets the required strength criteria.
 * If the password strength is insufficient, it throws a structured AppError with relevant feedback.
 *
 * @function passwordStrengthMiddleware
 * @param {Object} req - The Express request object containing the password in `req.body.newPassword`.
 * @param {Object} res - The Express response object (not used in this middleware).
 * @param {Function} next - The Express next middleware function to pass control to the next middleware or error handler.
 * @throws {AppError} Throws an error if the password strength score is below the threshold.
 */
const validatePasswordStrength = (req, res, next) => {
  try {
    const { newPassword } = req.body;
    
    // Check strength of the new password
    const strengthResult = checkPasswordStrength(newPassword);
    if (strengthResult.score < 3) {
      const feedback = {
        score: strengthResult.score,
        suggestions: strengthResult.feedback.suggestions || [],
        warning: strengthResult.feedback.warning || '',
      };
      
      // Create the error instance
      const passwordStrengthError = AppError.validationError('Password is too weak.', {
        details: feedback,
        type: 'PasswordStrengthError',
        additionalContext: 'Password validation middleware encountered an error.',
      });

      // Log the error in non-production environments
      if (process.env.NODE_ENV !== 'production') {
        logError('Password Strength Error:', req, passwordStrengthError.toLog(req));
      }

      // Throw the structured error
      throw passwordStrengthError;
    }
    
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    next(error); // Forward the error to the centralized error handler
  }
};

module.exports = validatePasswordStrength;
