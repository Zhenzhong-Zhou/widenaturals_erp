/**
 * @file min-limits.js
 * @description Centralized constants for minimum limits across the application.
 * Use this file to define and manage limits for rate limiting, pagination, or other configurations.
 */

const MIN_LIMITS = {
  INPUT_LENGTH: {
    DEFAULT_MIN_LENGTH: 1,
    MIN_FIRSTNAME: 2, // Minimum length for firstname
    MIN_LASTNAME: 2, // Minimum length for lastname
    MIN_PASSWORD: 8, // Minimum length for passwords
    MIN_EMAIL: 8, // Minimum length for email addresses
  },
};

module.exports = MIN_LIMITS;
