/**
 * @file auth-controller.js
 * @description Contains the logic for authentication routes.
 */

/**
 * POST /login
 * Handles user login.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const { logError, logInfo } = require('../utils/logger-helper');
const { authenticationError, validationError
} = require('../utils/AppError');
const { resetPassword } = require('../services/auth-service');
const wrapAsync = require('../utils/wrap-async');

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
 * POST /auth/reset-password
 * Handles password reset requests.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const resetPasswordController = wrapAsync(async (req, res, next) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      throw validationError('User ID and new password are required.');
    }
    
    // Call the service layer to reset the password
    await resetPassword(userId, currentPassword, newPassword);
    
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    logError('Error resetting password:', error);
    next(error); // Pass to global error handler
  }
});

// todo /auth/forgot-password

module.exports = { logoutController, resetPasswordController};
