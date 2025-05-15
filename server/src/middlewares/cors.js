/**
 * @file cors.js
 * @description Configures and applies CORS middleware for handling cross-origin requests.
 */

const { loadEnv } = require('../config/env');
const cors = require('cors');
const AppError = require('../utils/AppError');
const { logWarn, logError } = require('../utils/logger-helper');

loadEnv();

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
      
      const isDev = process.env.NODE_ENV === 'development';
      
      // Read allowed origins from environment variables
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().toLowerCase()).filter(Boolean)
        : isDev
          ? ['http://localhost:5173']
          : [];
      
      if (!origin) {
        // Handle requests without an Origin header
        if (allowedOrigins.length === 0) {
          logWarn(
            'CORS: No ALLOWED_ORIGINS set. All requests without origin may be allowed.',
            null,
            { middleware: 'cors', mode: process.env.NODE_ENV }
          );
        }

        // Log and allow requests without an origin (e.g., server-to-server or preflight)
        logWarn('CORS: Request without Origin header allowed.', null, {
          middleware: 'cors',
        });
        return callback(null, true);
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
      
      logWarn(corsError.message, null, {
        origin,
        middleware: 'cors',
      });
      
      return callback(corsError);
    } catch (error) {
      logError(error, null, {
        middleware: 'cors',
        context: 'CORS origin validation',
        origin,
      });
      
      const corsError = AppError.corsError('CORS configuration failed.', {
        details: { error: error.message },
      });
      
      return callback(corsError);
    }
  },
  methods: process.env.ALLOWED_METHODS?.split(',') || [
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ], // Allowed HTTP methods
  allowedHeaders: process.env.ALLOWED_HEADERS?.split(',') || [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ], // Allowed headers
  exposedHeaders: process.env.EXPOSED_HEADERS?.split(',') || ['Content-Disposition'], // Exposed headers
  credentials: process.env.ALLOW_CREDENTIALS === 'true', // Allow credentials (cookies, Authorization header, etc.)
  optionsSuccessStatus: parseInt(process.env.OPTIONS_SUCCESS_STATUS, 10) || 204, // Response status for preflight requests
});

module.exports = corsMiddleware;
