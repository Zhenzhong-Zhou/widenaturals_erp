/**
 * @file cors.js
 * @description Configures and applies CORS middleware for handling cross-origin requests.
 */

const cors = require('cors');
const { logWarn, logError } = require('../utils/logger-helper');

/**
 * Configures CORS middleware with allowed origins and other settings.
 * Ensures only trusted origins can access the API.
 */
const corsMiddleware = cors({
  origin: (origin, callback) => {
    try {
      // Fail fast in production if ALLOWED_ORIGINS is not defined
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
        throw new Error('ALLOWED_ORIGINS must be defined in production');
      }
      
      // Read allowed origins from environment variables
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (!allowedOrigins.length) {
        logWarn(
          'No allowed origins specified in ALLOWED_ORIGINS. CORS may be overly permissive.'
        );
      }
      
      // Allow requests from allowed origins or when origin is undefined (e.g., non-browser clients)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Reject requests from disallowed origins
      const error = new Error(`CORS error: Origin '${origin}' is not allowed`);
      error.name = 'CorsError';
      logWarn(error.message);
      callback(error);
    } catch (error) {
      logError('Error configuring CORS:', error);
      callback(new Error('CORS configuration failed'));
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
  exposedHeaders: process.env.EXPOSED_HEADERS?.split(',') || [], // Exposed headers
  credentials: process.env.ALLOW_CREDENTIALS === 'true', // Allow credentials (cookies, Authorization header, etc.)
  optionsSuccessStatus: parseInt(process.env.OPTIONS_SUCCESS_STATUS, 10) || 204, // Response status for preflight requests
});

module.exports = corsMiddleware;
