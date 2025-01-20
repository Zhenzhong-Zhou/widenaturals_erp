const AppError = require('../utils/AppError');
const { createUser } = require('./user-service');
const {
  validateRoleByName,
  validateStatus,
} = require('../validators/db-validators');
const { logError } = require('../utils/logger-helper');

/**
 * Creates an admin user by leveraging the user service.
 *
 * @param {object} adminDetails - Details specific to the admin being created.
 * @returns {Promise<string>} - The newly created admin's user ID.
 * @throws {AppError} - Throws an error if admin creation fails.
 */
const createAdmin = async (adminDetails) => {
  try {
    const { role, status, ...userDetails } = adminDetails;

    // Validate role and status
    const roleId = await validateRoleByName(role);
    const statusId = await validateStatus(status);

    // Add validated role and status to userDetails
    userDetails.roleId = roleId;
    userDetails.statusId = statusId;

    // Call the user service to create the admin
    const admin = await createUser(userDetails);

    return admin.id;
  } catch (error) {
    logError('Error creating admin user:', error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to create admin', 500, { type: 'ServiceError' });
  }
};

module.exports = { createAdmin };
