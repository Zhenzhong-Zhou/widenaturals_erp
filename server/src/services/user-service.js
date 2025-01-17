const { getClient } = require('../database/db');
const { insertUser } = require('../repositories/user-repository');
const { insertUserAuth } = require('../repositories/user-auth-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Creates a new user with authentication details.
 */
const createUser = async (userDetails) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN'); // Start transaction
    
    const user = await insertUser(client, userDetails);
    
    await insertUserAuth(client, {
      userId: user.id,
      passwordHash: userDetails.passwordHash,
      passwordSalt: userDetails.passwordSalt,
    });
    
    await client.query('COMMIT'); // Commit transaction
    return user;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    logError('Error creating user:', error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to create user', 500, { type: 'DatabaseError' });
  } finally {
    client.release();
  }
};

module.exports = { createUser };
