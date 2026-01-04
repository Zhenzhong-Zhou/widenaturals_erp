/**
 * @file login.js
 * @description Defines the public route for user login. This route allows users to authenticate and obtain access and refresh tokens.
 * @module routes/login
 */

const express = require('express');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validators/auth/login');
const {
  loginController,
  refreshTokenController,
} = require('../controllers/session-controller');
const {
  createLoginRateLimiter,
  createRefreshRateLimiter,
} = require('../middlewares/rate-limiter');

const router = express.Router();

/**
 * POST /login
 *
 * Authenticates a user using email and password and establishes
 * an authenticated session by issuing access and refresh tokens.
 *
 * This endpoint is the primary authentication entry point and
 * intentionally differs from standard CRUD routes.
 *
 * ─────────────────────────────────────────────────────────────
 * Security characteristics
 * ─────────────────────────────────────────────────────────────
 * - Rate-limited to mitigate brute-force and credential-stuffing attacks.
 * - Validates request body strictly using schema validation.
 * - Does NOT require prior authentication.
 * - Does NOT normalize, trim, or sanitize credential fields.
 * - Returns a uniform error response for invalid credentials to
 *   prevent user enumeration.
 *
 * ─────────────────────────────────────────────────────────────
 * Transactional behavior
 * ─────────────────────────────────────────────────────────────
 * - Executes within a single database transaction.
 * - Applies row-level locking on the authentication record.
 * - Ensures login attempt counters and lockout state remain
 *   consistent under concurrent access.
 *
 * ─────────────────────────────────────────────────────────────
 * Request body
 * ─────────────────────────────────────────────────────────────
 * {
 *   email: string,      // User email address
 *   password: string   // Plaintext password (opaque input)
 * }
 *
 * ─────────────────────────────────────────────────────────────
 * Successful response (200)
 * ─────────────────────────────────────────────────────────────
 * {
 *   message: string,           // "Login successful"
 *   accessToken: string,       // Short-lived access token
 *   csrfToken: string,         // CSRF token for subsequent requests
 *   lastLogin: string | null   // ISO timestamp of previous login
 * }
 *
 * ─────────────────────────────────────────────────────────────
 * Side effects
 * ─────────────────────────────────────────────────────────────
 * - Sets an HTTP-only refresh token cookie.
 * - Updates login attempt counters.
 * - Updates last_login timestamp on success.
 *
 * ─────────────────────────────────────────────────────────────
 * Error responses
 * ─────────────────────────────────────────────────────────────
 * - 400 Bad Request      → Invalid request payload
 * - 401 Unauthorized     → Invalid email or password
 * - 423 Locked           → Account temporarily locked
 * - 500 Internal Error   → Unexpected system failure
 *
 * Notes:
 * - Passwords are never logged, normalized, or persisted in plaintext.
 * - Refresh tokens are delivered exclusively via HTTP-only cookies.
 */
router.post(
  '/login',
  createLoginRateLimiter(),
  validate(loginSchema, 'body'),
  loginController
);

// Refresh token route
router.post('/refresh', createRefreshRateLimiter(), refreshTokenController);

// Placeholder for session tracking routes
// To track an active session (e.g., metadata like IP, device).
router.post('/track', (req, res) => {
  res
    .status(501)
    .json({ message: 'Session tracking route not implemented yet.' });
});

// To terminate a specific session.
router.post('/terminate', (req, res) => {
  res
    .status(501)
    .json({ message: 'Session termination route not implemented yet.' });
});

// To terminate all active sessions for a user.
router.post('/terminate-all', (req, res) => {
  res
    .status(501)
    .json({ message: 'Terminate all sessions route not implemented yet.' });
});

module.exports = router;
