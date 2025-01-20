const { withTransaction } = require('../database/db');
const { insertUser } = require('../repositories/user-repository');
const { insertUserAuth } = require('../repositories/user-auth-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { hashPasswordWithSalt } = require('../utils/password-helper');

/**
 * Creates a new user with authentication details.
 *
 * @param {object} userDetails - Details of the user to create.
 * @returns {Promise<object>} - The created user object.
 * @throws {AppError} - Throws an error if user creation fails.
 */
const createUser = async (userDetails) => {
  return await withTransaction(async (client) => {
    try {
      // Insert the user into the database
      const user = await insertUser(client, userDetails);
      const { passwordHash, passwordSalt } = await hashPasswordWithSalt(
        userDetails.password
      );

      // Insert authentication details for the user
      await insertUserAuth(client, {
        userId: user.id,
        passwordHash,
        passwordSalt,
      });

      // Return the created user
      return user;
    } catch (error) {
      logError('Error creating user:', error);
      throw error instanceof AppError
        ? error
        : new AppError('Failed to create user', 500, { type: 'DatabaseError' });
    }
  });
};

module.exports = { createUser };
