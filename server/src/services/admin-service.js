const AppError = require('../utils/AppError');
const { hashPasswordWithSalt } = require('../utils/password-helper');
const { createUser } = require('../repositories/user-repository');
const {
  validateRoleByName,
  validateStatus,
} = require('../validators/db-validators');
const { logError } = require('../utils/logger-helper');

/**
 * Business logic for creating an admin user.
 */
const createAdmin = async ({
  email,
  password,
  role,
  status,
  firstname,
  lastname,
  phoneNumber = null,
  jobTitle = null,
  note = null,
  createdBy = null,
}) => {
  try {
    // Validate role and status
    const roleId = await validateRoleByName(role).catch((error) => {
      throw new AppError('Invalid role provided.', 400, {
        type: 'ValidationError',
        isExpected: true,
      });
    });

    const statusId = await validateStatus(status).catch((error) => {
      throw new AppError('Invalid status provided.', 400, {
        type: 'ValidationError',
        isExpected: true,
      });
    });

    // Hash the password
    const { passwordHash, passwordSalt } = await hashPasswordWithSalt(
      password
    ).catch((error) => {
      throw new AppError('Password hashing failed.', 500, {
        type: 'ServiceError',
        isExpected: false,
      });
    });

    // Create the admin user in the database
    const newAdmin = await createUser({
      email,
      passwordHash,
      passwordSalt,
      roleId,
      statusId,
      firstname,
      lastname,
      phoneNumber,
      jobTitle,
      note,
      createdBy,
    }).catch((error) => {
      throw new AppError(
        'Database operation failed while creating the user.',
        500,
        {
          type: 'DatabaseError',
          isExpected: false,
        }
      );
    });

    return newAdmin.id;
  } catch (error) {
    logError('Error in createAdmin service:', error);

    // If the error is not an instance of AppError, wrap it
    if (!(error instanceof AppError)) {
      throw new AppError(
        error.message || 'An unexpected error occurred.',
        500,
        {
          type: 'UnexpectedError',
          isExpected: false,
        }
      );
    }

    throw error; // Re-throw the AppError to be handled by middleware
  }
};

module.exports = { createAdmin };
