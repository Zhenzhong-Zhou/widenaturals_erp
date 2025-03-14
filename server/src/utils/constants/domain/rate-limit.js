const {
  FIFTEEN_MINUTES,
  ONE_MINUTE,
  FIVE_MINUTES,
  TEN_MINUTES,
} = require('../general/time');
const {
  RATE_LIMIT_GLOBAL,
  RATE_LIMIT_API,
  RATE_LIMIT_LOGIN,
  RATE_LIMIT_AUTHENTICATION,
  RATE_LIMIT_AUTHORIZATION,
  RATE_LIMIT_PASSWORD_RESET,
  RATE_LIMIT_SIGNUP,
  RATE_LIMIT_ADMIN,
  RATE_LIMIT_FILE_UPLOAD,
  RATE_LIMIT_FORGOT_USERNAME,
  RATE_LIMIT_CSRF_TOKEN,
} = require('../messages/error-messages');
const { RATE_LIMIT_MAX } = require('../general/max-limits');

const RATE_LIMIT = {
  DEFAULT_WINDOW_MS: FIFTEEN_MINUTES,
  DEFAULT_MAX: 100,
  DEFAULT_MESSAGE: 'Too many requests, please try again later.',

  GLOBAL: {
    WINDOW_MS: FIFTEEN_MINUTES,
    MAX: RATE_LIMIT_MAX.GLOBAL,
    MESSAGE: RATE_LIMIT_GLOBAL,
  },

  API: {
    WINDOW_MS: ONE_MINUTE,
    MAX: RATE_LIMIT_MAX.API,
    MESSAGE: RATE_LIMIT_API,
  },

  CSRF: {
    WINDOW_MS: FIFTEEN_MINUTES,
    MAX: RATE_LIMIT_MAX.CSRF,
    MESSAGE: RATE_LIMIT_CSRF_TOKEN,
  },

  LOGIN: {
    WINDOW_MS: FIVE_MINUTES,
    MAX: RATE_LIMIT_MAX.LOGIN,
    MESSAGE: RATE_LIMIT_LOGIN,
  },

  AUTHENTICATION: {
    WINDOW_MS: FIVE_MINUTES,
    MAX: RATE_LIMIT_MAX.AUTHENTICATION, // 10 login attempts every 5 minutes
    MESSAGE: RATE_LIMIT_AUTHENTICATION,
  },

  AUTHORIZATION: {
    WINDOW_MS: ONE_MINUTE, // 1 minute window for authorization checks
    MAX: RATE_LIMIT_MAX.AUTHORIZATION, // 50 authorization requests per minute
    MESSAGE: RATE_LIMIT_AUTHORIZATION,
  },

  REFRESH: {
    WINDOW_MS: FIFTEEN_MINUTES,
    MAX: RATE_LIMIT_MAX.REFRESH,
    MESSAGE: '',
  },

  PASSWORD_RESET: {
    WINDOW_MS: TEN_MINUTES,
    MAX: RATE_LIMIT_MAX.PASSWORD_RESET,
    MESSAGE: RATE_LIMIT_PASSWORD_RESET,
  },

  USER_PROFILE: {
    WINDOW_MS: FIFTEEN_MINUTES,
    MAX: RATE_LIMIT_MAX.USER_PROFILE,
    MESSAGE: '',
  },

  SIGNUP: {
    WINDOW_MS: TEN_MINUTES,
    MAX: RATE_LIMIT_MAX.SIGNUP,
    MESSAGE: RATE_LIMIT_SIGNUP,
  },

  ADMIN: {
    WINDOW_MS: FIVE_MINUTES,
    MAX: RATE_LIMIT_MAX.ADMIN,
    MESSAGE: RATE_LIMIT_ADMIN,
  },

  FILE_UPLOAD: {
    WINDOW_MS: TEN_MINUTES,
    MAX: RATE_LIMIT_MAX.FILE_UPLOAD,
    MESSAGE: RATE_LIMIT_FILE_UPLOAD,
  },

  FORGOT_USERNAME: {
    WINDOW_MS: TEN_MINUTES,
    MAX: RATE_LIMIT_MAX.FORGOT_USERNAME,
    MESSAGE: RATE_LIMIT_FORGOT_USERNAME,
  },
};

module.exports = RATE_LIMIT;
