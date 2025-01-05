const zxcvbn = require('zxcvbn');

// Function to check password strength
const checkPasswordStrength = (password) => {
  const result = zxcvbn(password);
  const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  
  return {
    score: result.score, // 0 (weak) to 4 (very strong)
    strength: strengthLevels[result.score],
    feedback: result.feedback, // Suggestions for improving password strength
  };
};

module.exports = checkPasswordStrength;
