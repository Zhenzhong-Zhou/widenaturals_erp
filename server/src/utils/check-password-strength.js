const zxcvbn = require('zxcvbn');
const AppError = require('./AppError');

/**
 * Analyzes the strength of a password using zxcvbn.
 *
 * @param {string} password - The password to evaluate.
 * @returns {object} - An object containing the score, strength, feedback, and threshold status.
 * @throws {AppError} - If the password is not a valid string.
 */
const checkPasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    throw AppError.validationError('Password must be a non-empty string.', {
      type: 'PasswordValidationError',
      isExpected: true,
    });
  }

  const result = zxcvbn(password);
  const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  const customFeedback = {
    0: 'Your password is too weak. Avoid using common words or patterns.',
    1: 'Your password is weak. Use a mix of upper and lowercase letters.',
    2: 'Your password is fair. Consider adding numbers and special characters.',
    3: 'Your password is strong. Ensure it’s unique and not used elsewhere.',
    4: 'Your password is very strong. Great job!',
  };

  return {
    score: result.score, // 0 (weak) to 4 (very strong)
    strength: strengthLevels[result.score],
    feedback: {
      suggestions: result.feedback.suggestions.length
        ? result.feedback.suggestions
        : [customFeedback[result.score]],
      warning:
        result.feedback.warning ||
        'Consider making your password stronger for better security.',
    },
    meetsThreshold: result.score >= 3,
  };
};

module.exports = checkPasswordStrength;
