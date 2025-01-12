/**
 * @file cors.js
 * @description Configures and applies CORS middleware for handling cross-origin requests.
 */

const cors = require('cors');
const AppError = require('../utils/AppError');
const { logWarn, logError } = require('../utils/logger-helper');

/**
 * Configures CORS middleware with allowed origins and other settings.
 * Ensures only trusted origins can access the API.
 */
const corsMiddleware = cors({
  origin: (origin, callback) => {
    try {
      // Fail fast in production if ALLOWED_ORIGINS is not defined
      if (
        process.env.NODE_ENV === 'production' &&
        !process.env.ALLOWED_ORIGINS
      ) {
        throw AppError.corsError(
          'ALLOWED_ORIGINS must be defined in production.',
          {
            details: { environment: 'production' },
          }
        );
      }

      // Read allowed origins from environment variables
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').filter(Boolean)
        : [];

      if (!origin) {
        // Allow requests with no origin (e.g., preflight or server-to-server communication)
        if (allowedOrigins.length === 0) {
          logWarn(
            'No allowed origins specified in ALLOWED_ORIGINS. CORS may be overly permissive.'
          );
        }
        return callback(null, true); // Allow the request
      }

      // Allow requests from allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true); // Allow the request
      }

      // Reject requests from disallowed origins
      const corsError = AppError.corsError(
        `CORS error: Origin '${origin}' is not allowed.`,
        {
          details: { origin },
        }
      );
      logWarn(corsError.message, { origin });
      return callback(corsError);
    } catch (error) {
      logError('Error configuring CORS:', {
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      });
      const corsError = AppError.corsError('CORS configuration failed.', {
        details: { error: error.message },
      });
      callback(corsError);
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
