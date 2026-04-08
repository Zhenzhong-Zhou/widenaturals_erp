/**
 * @file cors.js
 * @description Configures and exports the CORS middleware for the Express application.
 *
 * Allowed origins, methods, and headers are resolved once at module load time
 * from environment variables so the per-request origin callback is as cheap
 * as possible (a single Set lookup).
 *
 * Environment variables:
 *   ALLOWED_ORIGINS       — comma-separated list of allowed origins.
 *                           Defaults to http://localhost:5173 in development.
 *                           Must be explicitly set in production.
 *   ALLOWED_METHODS       — comma-separated HTTP methods (optional).
 *   ALLOWED_HEADERS       — comma-separated request headers (optional).
 *   EXPOSED_HEADERS       — comma-separated response headers (optional).
 *   ALLOW_CREDENTIALS     — 'true' to allow cookies / Authorization header.
 *   OPTIONS_SUCCESS_STATUS — HTTP status for preflight responses (default 204).
 */

'use strict';

const cors = require('cors');
const AppError = require('../utils/AppError');
const { logWarn, logError } = require('../utils/logging/logger-helper');

const CONTEXT = 'middleware/cors';

// -----------------------------------------------------------------------------
// Resolve configuration once at module load time
// Running this inside the per-request callback would re-parse env vars and
// rebuild the origins Set on every request.
// -----------------------------------------------------------------------------

// Fail fast: production must declare allowed origins explicitly.
// Checked here (module load = startup) so the error surfaces immediately
// rather than on the first inbound request.
if (
  process.env.NODE_ENV === 'production' &&
  !process.env.ALLOWED_ORIGINS
) {
  throw AppError.corsError('ALLOWED_ORIGINS must be defined in production.', {
    details: { environment: 'production' },
  });
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Set of lowercase, trimmed origins that are permitted to access the API.
 * Using a Set gives O(1) lookup in the per-request origin callback.
 *
 * @type {Set<string>}
 */
const allowedOriginsSet = new Set(
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim().toLowerCase()).filter(Boolean)
    : isDev
      ? ['http://localhost:5173']
      : []
);

// Warn once at startup if no origins are configured outside of production.
// (Production already throws above, so this only fires in development/test
// when ALLOWED_ORIGINS is intentionally omitted.)
if (allowedOriginsSet.size === 0) {
  logWarn('CORS: No ALLOWED_ORIGINS configured — all originless requests will be allowed.', null, {
    context: CONTEXT,
    mode: process.env.NODE_ENV,
  });
}

// -----------------------------------------------------------------------------
// Static config values — also resolved once at module load
// -----------------------------------------------------------------------------

const DEFAULT_METHODS  = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const DEFAULT_HEADERS  = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'];
const DEFAULT_EXPOSED  = ['Content-Disposition'];

// -----------------------------------------------------------------------------
// CORS middleware
// -----------------------------------------------------------------------------

/**
 * Configured CORS middleware instance.
 *
 * Origin validation logic:
 *   - Requests without an Origin header (e.g. same-origin, server-to-server,
 *     curl) are allowed through — the browser enforces CORS, not the server.
 *   - Requests from an origin in `allowedOriginsSet` are allowed.
 *   - All other origins receive a CorsError and a 403 response.
 *
 * @type {import('express').RequestHandler}
 */
const corsMiddleware = cors({
  origin: (origin, callback) => {
    try {
      // No Origin header — allow through. This covers same-origin browser
      // requests, server-to-server calls, and tools like curl/Postman.
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOriginsSet.has(origin.toLowerCase())) {
        return callback(null, true);
      }
      
      // Origin is set but not in the allow-list — reject with a CORS error.
      const corsError = AppError.corsError(
        `CORS policy: Origin '${origin}' is not allowed.`,
        { details: { origin } }
      );
      
      logWarn('CORS request rejected', null, {
        context: CONTEXT,
        origin,
      });
      
      return callback(corsError);
      
    } catch (error) {
      // Unexpected error in the origin callback — log internally and return
      // a generic CORS error so internal details are never sent to the client.
      logError(error, null, {
        context: CONTEXT,
        meta: { origin, message: error.message },
      });
      
      return callback(
        AppError.corsError('CORS configuration error.', {
          details: { origin },
        })
      );
    }
  },
  
  methods: process.env.ALLOWED_METHODS?.split(',') ?? DEFAULT_METHODS,
  
  allowedHeaders: process.env.ALLOWED_HEADERS?.split(',') ?? DEFAULT_HEADERS,
  
  exposedHeaders: process.env.EXPOSED_HEADERS?.split(',') ?? DEFAULT_EXPOSED,
  
  credentials: process.env.ALLOW_CREDENTIALS === 'true',
  
  optionsSuccessStatus: parseInt(process.env.OPTIONS_SUCCESS_STATUS, 10) || 204,
});

module.exports = corsMiddleware;
