const { withTransaction } = require('../database/db');
const {
  insertUser,
  getUser,
  getAllUsers,
} = require('../repositories/user-repository');
const { insertUserAuth } = require('../repositories/user-auth-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { hashPasswordWithSalt } = require('../utils/password-helper');

/**
 * Service to fetch all users with pagination and sorting.
 *
 * @param {Object} options - Options for pagination and sorting.
 * @param {number} options.page - The page number to fetch.
 * @param {number} options.limit - The number of records per page.
 * @param {string} options.sortBy - Column to sort by.
 * @param {string} options.sortOrder - Sort order ('ASC' or 'DESC').
 * @returns {Promise<Object>} - Paginated users and metadata.
 */
const fetchAllUsers = async ({ page, limit, sortBy, sortOrder }) => {
  try {
    // Call repository function
    return await getAllUsers({ page, limit, sortBy, sortOrder });
  } catch (error) {
    console.log(error);
    logError('Error in fetchAllUsers service:', error);
    throw new AppError('Failed to fetch users from service layer', 500, {
      type: 'ServiceError',
      details: error.message,
    });
  }
};

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

/**
 * Retrieves a user's profile by their ID.
 *
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<Object>} - The user's profile information.
 * @throws {AppError} - If the user ID is invalid or the user is not found.
 */
const getUserProfileById = async (userId) => {
  // Validate the input
  if (!userId || typeof userId !== 'string') {
    throw AppError.validationError('Invalid user ID provided', 400, {
      type: 'ValidationError',
      isExpected: true,
    });
  }

  try {
    // Fetch user profile from the repository
    const user = await getUser(null, 'id', userId);

    if (!user) {
      throw AppError.notFoundError(`User with ID ${userId} not found`, 404, {
        type: 'NotFoundError',
        isExpected: true,
      });
    }

    // Map and return the user profile
    return mapUserProfile(user);
  } catch (error) {
    // Log the error with additional context
    logError(`Error retrieving user profile for ID ${userId}:`, {
      userId,
      error: error.message,
      stack: error.stack,
    });

    // Rethrow known errors or wrap unknown errors
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'An unexpected error occurred while fetching the user profile',
      500,
      {
        type: 'InternalError',
      }
    );
  }
};

/**
 * Maps a user database record to a user profile response object.
 *
 * @param {Object} user - The user record from the database.
 * @returns {Object} - The mapped user profile.
 */
const mapUserProfile = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role_name,
  firstname: user.firstname,
  lastname: user.lastname,
  phone_number: user.phone_number,
  job_title: user.job_title,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

module.exports = { fetchAllUsers, createUser, getUserProfileById };
