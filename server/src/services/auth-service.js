const AppError = require('../utils/app-error');
const { getUserAuthByEmail } = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../utils/password-helper');
const { signToken } = require('../utils/token-helper');

/**
 * Handles user login business logic.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - Access and refresh tokens.
 * @throws {AppError} - If authentication fails.
 */
const loginUser = async (email, password) => {
  try {
    const user = await getUserAuthByEmail(email);
    
    if (!user) {
      throw new AppError('Invalid email or password.', 401, {
        type: 'AuthenticationError',
        isExpected: true,
      });
    }
    
    const { passwordhash, passwordsalt } = user;
    
    // Verify the password
    const isValidPassword = await verifyPassword(password, passwordhash, passwordsalt);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password.', 401, {
        type: 'AuthenticationError',
        isExpected: true,
      });
    }
    
    // Generate tokens
    const accessToken = signToken({ id: user.id, role_id: user.role_id });
    const refreshToken = signToken({ id: user.id, role_id: user.role_id }, true); // Refresh token
    
    return { accessToken, refreshToken };
  } catch (error) {
    if (!(error instanceof AppError)) {
      throw new AppError(error.message || 'Login failed.', 500, {
        type: 'UnexpectedError',
        isExpected: false,
      });
    }
    throw error; // Re-throw AppError for middleware handling
  }
};

module.exports = { loginUser };
