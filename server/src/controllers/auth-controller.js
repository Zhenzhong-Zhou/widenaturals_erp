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
const { loginUser } = require('../services/auth-service');
const { logError, logWarn } = require('../utils/logger-helper');

/**
 * Controller to handle user login.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const loginController = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Call the service layer for business logic
    const { accessToken, refreshToken } = await loginUser(email, password);
    
    // Set tokens in cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /signup
 * Handles user registration.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const signup = (req, res) => {
  const { username, email, password } = req.body;

  // Logic to register a new user
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: 'Username, email, and password are required.' });
  }

  // Example: Mock registration logic (Replace with database insertion)
  res.status(201).json({ message: 'Signup successful', username });
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

module.exports = { loginController, signup, refreshTokenController };
