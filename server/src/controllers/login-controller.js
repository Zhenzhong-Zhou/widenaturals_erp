const { loginUser } = require('../services/auth-service');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Handles user login by validating credentials and issuing tokens.
 *
 * Workflow:
 * 1. Extracts email and password from the request body.
 * 2. Delegates business logic to the service layer (`loginUser`).
 * 3. If successful:
 *    - Issues access and refresh tokens.
 *    - Sets refresh token in secure HTTP-only cookies.
 *    - Returns a success response.
 * 4. If unsuccessful:
 *    - Returns appropriate error messages for invalid credentials or server errors.
 *
 * @param {object} req - Express request object.
 * @param {object} req.body - Request body containing email and password.
 * @param {string} req.body.email - User's email for login.
 * @param {string} req.body.password - User's password for login.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends HTTP response with success or error message.
 * @throws {Error} - Logs and handles unexpected server errors.
 */
const loginController = async (req, res, next) => {
  const { email, password } = req.body;
  
  try {
    // Call the service layer for business logic
    const { accessToken, refreshToken, last_login } = await loginUser(email, password);
    
    // Set tokens in cookies
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Return success response
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      lastLogin: last_login || null,
    });
  } catch (error) {
    // Log unexpected errors
    if (!(error instanceof AppError)) {
      logError('Unexpected error during login:', error);
      return next(new AppError('Internal server error', 500, {
        type: 'UnexpectedError',
        isExpected: false,
      }));
    }
    
    // Log expected errors for debugging (if necessary)
    logError('Handled error during login:', error);
    
    // Return structured error response
    res.status(error.status).json(error.toJSON());
  }
};

module.exports = { loginController };
