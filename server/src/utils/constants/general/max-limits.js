/**
 * @file max-limits.js
 * @description Centralized constants for maximum limits across the application.
 * Use this file to define and manage limits for rate limiting, pagination, or other configurations.
 */

const MAX_LIMITS = {
  RATE_LIMIT_MAX: {
    GLOBAL: 200, // Maximum requests for global rate limiting
    API: 50,     // Maximum API requests per minute
    LOGIN: 10,   // Maximum login attempts per window
    AUTHENTICATION: 10,     // Maximum authentication attempts
    AUTHORIZATION: 50,     // Maximum authorization attempts
    PASSWORD_RESET: 5, // Maximum password reset requests
    SIGNUP: 5,         // Maximum signup attempts
    ADMIN: 20,         // Maximum admin requests
    FILE_UPLOAD: 10,   // Maximum file uploads
    FORGOT_USERNAME: 5, // Maximum forgot username requests
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20, // Default number of items per page
    MAX_PAGE_SIZE: 100,    // Maximum items allowed per page
  },
  INPUT_LENGTH: {
    USERNAME: 50,    // Maximum length for usernames
    PASSWORD: 128,   // Maximum length for passwords
    EMAIL: 254,      // Maximum length for email addresses
    GENERIC_FIELD: 255, // Maximum length for generic text fields
  },
};

module.exports = MAX_LIMITS;
