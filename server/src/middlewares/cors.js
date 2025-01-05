/**
 * @file cors.js
 * @description Configures and applies CORS middleware for handling cross-origin requests.
 */

const cors = require('cors');
const { logWarn } = require('../utils/logger-helper');

/**
 * Configures CORS middleware with allowed origins and other settings.
 * Ensures only trusted origins can access the API.
 */
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Fail fast in production if ALLOWED_ORIGINS is not defined
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
      throw new Error('ALLOWED_ORIGINS must be defined in production');
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []; // Read from .env
    if (!allowedOrigins.length) {
      logWarn(
        'No allowed origins specified in ALLOWED_ORIGINS. CORS may be overly permissive.'
      );
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      const error = new Error(`CORS error: Origin '${origin}' is not allowed`);
      logWarn(error.message);
      callback(error); // Reject request
    }
  },
  methods: process.env.ALLOWED_METHODS?.split(',') || [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
  ], // Allowed HTTP methods
  allowedHeaders: process.env.ALLOWED_HEADERS?.split(',') || [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ], // Allowed headers
  credentials: process.env.ALLOW_CREDENTIALS === 'true', // Allow credentials (cookies, Authorization header, etc.)
  optionsSuccessStatus: parseInt(process.env.OPTIONS_SUCCESS_STATUS, 10) || 204, // Response status for preflight requests
});

module.exports = corsMiddleware;
