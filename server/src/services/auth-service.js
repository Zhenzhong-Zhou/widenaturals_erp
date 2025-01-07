const { getUserAuthByEmail } = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../utils/password-helper');
const { signToken } = require('../utils/token-helper');

/**
 * Handles user login business logic.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - Access and refresh tokens.
 * @throws {Error} - If authentication fails.
 */
const loginUser = async (email, password) => {
  const user = await getUserAuthByEmail(email);
  
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  
  const { passwordhash, passwordsalt } = user;
  
  // Verify the password
  const isValidPassword = await verifyPassword(password, passwordhash, passwordsalt);
  if (!isValidPassword) {
    throw new Error('Invalid email or password.');
  }
  
  // Generate tokens
  const accessToken = signToken({ id: user.id, role_id: user.role_id });
  const refreshToken = signToken({ id: user.id, role_id: user.role_id }, true); // Refresh token
  
  return { accessToken, refreshToken };
};

module.exports = { loginUser };
