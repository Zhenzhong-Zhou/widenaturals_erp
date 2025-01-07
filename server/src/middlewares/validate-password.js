const AppError = require('../utils/app-error');
const validatePassword = require('../validators/password-validators');
const checkPasswordStrength = require('../utils/check-password-strength');

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
    
    // Validate password structure using Joi schema
    const { error } = validatePassword.validate(password);
    if (error) {
      throw new AppError('Invalid Password Format', 400, {
        type: 'ValidationError',
        details: error.details.map((detail) => ({
          message: detail.message,
          path: detail.path,
        })),
      });
    }
    
    // Check password strength using zxcvbn
    const strengthResult = checkPasswordStrength(password);
    if (strengthResult.score < 3) { // Consider "Strong" as 3 or higher
      throw new AppError('Weak Password', 400, {
        type: 'PasswordStrengthError',
        details: {
          score: strengthResult.score,
          strength: strengthResult.strength,
          feedback: strengthResult.feedback,
        },
      });
    }
    
    next();
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
};

module.exports = passwordValidationMiddleware;
