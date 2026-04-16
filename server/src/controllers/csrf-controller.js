/**
 * @file csrf-controller.js
 * @module controllers/csrf-controller
 *
 * @description
 * Controller for CSRF token generation.
 *
 * Routes:
 *   GET /api/v1/auth/csrf  → generateCsrfTokenController
 *
 * This is a thin controller by design — no service layer is required
 * because CSRF token generation is framework-provided, stateless,
 * and request-scoped via the csurf middleware.
 *
 * All errors are handled by wrapAsyncHandler and delegated to the
 * global error handler without try/catch boilerplate.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/csrf
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates and returns a per-request CSRF token for frontend usage.
 *
 * Call this during app bootstrap or before any state-changing request.
 * The token must be included in subsequent mutating requests via header or body.
 *
 * Cache headers are set to prevent token reuse or leakage via intermediaries.
 *
 * @route  GET /api/v1/auth/csrf
 * @access Public
 */
const generateCsrfTokenController = wrapAsyncHandler((req, res) => {
  const csrfToken = req.csrfToken();

  // Prevent token caching at every layer — browser, proxy, and CDN
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  res.status(200).json({
    success: true,
    csrfToken,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  generateCsrfTokenController,
};
