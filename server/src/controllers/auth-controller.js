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
const { signToken, verifyToken } = require('../utils/token-helper');
const { logError, logWarn, logInfo } = require('../utils/logger-helper');

/**
 * Handles user logout by clearing authentication cookies and invalidating tokens.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const logoutController = (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Log user details for auditing (only in development and test environments)
    if (!isProduction && req.user) {
      logInfo(`User ${req.user.id} logged out at ${new Date().toISOString()}`);
    }
    
    // Clear cookies storing the access and refresh tokens
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    });
    
    if (!req.cookies.accessToken && !req.cookies.refreshToken) {
      return res.status(200).json({ message: 'No active session found' });
    }
    
    // Optionally clear additional cookies if used
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Failed to log out. Please try again later.' });
  }
};

/**
 * Controller to handle token refresh requests.
 * Verifies the refresh token and generates a new access token.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const refreshTokenController = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    // Check if the refresh token exists
    if (!refreshToken) {
      logWarn('Refresh token is missing.');
      return res.status(401).json({ error: 'Refresh token is required. Please log in again.' });
    }
    
    // Verify the refresh token
    const payload = verifyToken(refreshToken, true); // `true` indicates this is a refresh token
    
    // Generate a new access token
    const newAccessToken = signToken({ id: payload.id, role: payload.role });
    
    // Rotate the refresh token (optional but recommended)
    const newRefreshToken = signToken({ id: payload.id, role: payload.role }, true); // Pass `true` for refresh token
    
    // Set the new access token and refresh token in cookies
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({ message: 'Token refreshed successfully.' });
  } catch (error) {
    logError('Error refreshing token:', error);
    
    // Handle token verification errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }
    
    return res.status(401).json({ error: 'Invalid refresh token. Please log in again.' });
  }
};

module.exports = {  logoutController, refreshTokenController };
