const { loginUser } = require('../services/auth-service');
const { logError } = require('../utils/logger-helper');

/**
 * @module controllers/login
 * @description Controller to handle user login.
 */

/**
 * Handles user login by validating credentials and issuing tokens.
 *
 * Workflow:
 * 1. Extracts email and password from the request body.
 * 2. Delegates business logic to the service layer (`loginUser`).
 * 3. If successful:
 *    - Issues access and refresh tokens.
 *    - Sets tokens in secure HTTP-only cookies.
 *    - Returns a success response.
 * 4. If unsuccessful:
 *    - Returns appropriate error messages for invalid credentials or server errors.
 *
 * @param {object} req - Express request object.
 * @param {object} req.body - Request body containing email and password.
 * @param {string} req.body.email - User's email for login.
 * @param {string} req.body.password - User's password for login.
 * @param {object} res - Express response object.
 * @returns {void} - Sends HTTP response with success or error message.
 * @throws {Error} - Logs and handles unexpected server errors.
 *
 * @example
 * // Request Body
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword123"
 * }
 *
 * // Successful Response
 * {
 *   "message": "Login successful"
 * }
 *
 * // Error Response (Invalid credentials)
 * {
 *   "error": "Invalid email or password."
 * }
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
    
    // Return success response
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    // Log the error
    logError('Error during login:', error);
    
    // Handle invalid credentials error
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    
    // Handle unexpected server errors
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { loginController };
