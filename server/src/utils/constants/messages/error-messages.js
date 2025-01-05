const ERROR_MESSAGES = {
  RATE_LIMIT_GLOBAL: 'Too many requests. Please try again later.',
  RATE_LIMIT_API: 'API rate limit exceeded. Please try again later.',
  RATE_LIMIT_LOGIN: 'Too many login attempts. Please try again later.',
  RATE_LIMIT_SIGNUP: 'Too many signup attempts. Please try again later.',
  RATE_LIMIT_AUTHENTICATION: 'Too many login attempts. Please try again later.',
  RATE_LIMIT_AUTHORIZATION: 'Too many authorization requests. Please wait.',
  RATE_LIMIT_PASSWORD_RESET:
    'Too many password reset requests. Please try again later.',
  RATE_LIMIT_ADMIN: 'Too many admin requests. Please try again later.',
  RATE_LIMIT_FILE_UPLOAD:
    'Too many file upload requests. Please try again later.',
  RATE_LIMIT_FORGOT_USERNAME:
    'Too many forgot username requests. Please try again later.',
};

module.exports = ERROR_MESSAGES;
