/**
 * @file auth-controller.js
 * @description Contains the logic for authentication routes.
 */

const wrapAsync = require('../utils/wrap-async');
const { changePasswordService } = require('../services/auth-service');
const { authenticationError } = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');

/**
 * Handles user logout by clearing authentication cookies and invalidating tokens.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param next
 */
const logoutController = (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log user details for auditing in non-production environments
    if (!isProduction && req.user) {
      logInfo(`User ${req.user.id} logged out at ${new Date().toISOString()}`);
    }

    // Optional: Check if refreshToken exists in the cookies before proceeding
    if (!req.cookies.refreshToken) {
      return next(
        authenticationError('No active session found', {
          isExpected: true,
        })
      );
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error); // Delegate error handling to your centralized error handler
  }
};

/**
 * POST /auth/change-password
 *
 * Changes the password of the currently authenticated user.
 *
 * This endpoint performs an authenticated password change and
 * invalidates existing refresh tokens to force re-authentication
 * on subsequent requests.
 *
 * ─────────────────────────────────────────────────────────────
 * Security characteristics
 * ─────────────────────────────────────────────────────────────
 * - Requires prior authentication
 * - Verifies the user's current password
 * - Enforces the configured password policy
 * - Prevents password reuse based on history
 * - Invalidates existing refresh tokens
 *
 * ─────────────────────────────────────────────────────────────
 * Request body
 * ─────────────────────────────────────────────────────────────
 * {
 *   currentPassword: string, // Existing password
 *   newPassword: string      // New password (policy-enforced)
 * }
 *
 * ─────────────────────────────────────────────────────────────
 * Successful response (200)
 * ─────────────────────────────────────────────────────────────
 * {
 *   success: true,
 *   changedAt: string,       // ISO timestamp
 *   message: string
 * }
 */
const changePasswordController = wrapAsync(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  // All security invariants are enforced within the service layer
  await changePasswordService(userId, currentPassword, newPassword);
  
  // Invalidate existing refresh tokens to force re-authentication
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  
  return res.status(200).json({
    success: true,
    changedAt: new Date().toISOString(),
    message: 'Password changed successfully.',
  });
});

// todo /auth/forgot-password

module.exports = {
  logoutController,
  changePasswordController,
};
