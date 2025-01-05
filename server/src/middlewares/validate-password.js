const validatePassword = require('../validators/password-validators');
const checkPasswordStrength = require('../utils/check-password-strength');

const passwordValidationMiddleware = (req, res, next) => {
  const { password } = req.body;
  
  // Validate password structure using Joi
  const { error } = validatePassword.validate(password);
  if (error) {
    return res.status(400).json({ errors: error.details.map((err) => err.message) });
  }
  
  // Check password strength using zxcvbn
  const strengthResult = checkPasswordStrength(password);
  if (strengthResult.score < 3) { // Consider "Strong" as 3 or higher
    return res.status(400).json({
      message: 'Password strength is insufficient.',
      strength: strengthResult.strength,
      feedback: strengthResult.feedback,
    });
  }
  
  next();
};

module.exports = passwordValidationMiddleware;
