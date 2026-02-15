const wrapAsync = require('../utils/wrap-async');

/**
 * Generate and return a CSRF token for frontend usage.
 *
 * This controller is intended to be called by the frontend during
 * application bootstrap or before submitting state-changing requests.
 *
 * Behavior:
 * - Generates a per-request CSRF token using `csurf` (`req.csrfToken()`).
 * - Disables all HTTP caching to prevent token reuse or leakage.
 * - Returns the token in a JSON response body.
 *
 * Design notes:
 * - This is a thin controller by design; no service layer is required
 *   because CSRF token generation is framework-provided, stateless,
 *   and request-scoped.
 * - Errors are handled by `wrapAsync` and delegated to global
 *   error-handling middleware for consistent logging and response formatting.
 *
 * Security considerations:
 * - Tokens must never be cached by intermediaries or the browser.
 * - Tokens should be included by the frontend in subsequent
 *   state-changing requests (e.g., via headers or request body),
 *   depending on the client implementation.
 *
 * @route   GET /auth/csrf
 * @access  Public
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
const generateCsrfTokenController = wrapAsync((req, res) => {
  const csrfToken = req.csrfToken();

  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  res.json({ csrfToken });
});

module.exports = {
  generateCsrfTokenController,
};
