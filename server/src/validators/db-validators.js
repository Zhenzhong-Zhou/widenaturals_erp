const { getRoleIdByField } = require('../repositories/role-repository');
const { getStatusIdByName } = require('../repositories/status-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { userExists } = require('../repositories/user-repository');

/**
 * Validates if a user exists by a specific field and value.
 *
 * @param {string} field - The field to check (e.g., 'id', 'email').
 * @param {string} value - The value of the field to validate.
 * @returns {Promise<Object>} - The user record if it exists.
 * @throws {AppError} - If the user does not exist.
 */
const validateUserExists = async (field, value) => {
  // Validate input
  if (!field || !value) {
    throw AppError.validationError('Both field and value are required for user validation.');
  }
  
  // Check if the user exists
  const user = await userExists(field, value);
  
  if (!user) {
    throw AppError.notFoundError(`User with ${value} not found.`);
  }
  return user;
};

/**
 * Validates the existence of a role by its name.
 * @param {string} roleName - The name of the role.
 * @returns {Promise<uuid>} - The role ID if valid.
 * @throws {AppError} - If the role does not exist or database operation fails.
 */
const validateRoleByName = async (roleName) => {
  try {
    const roleId = await getRoleIdByField('name', roleName);
    if (!roleId) {
      throw AppError.validationError(`Invalid role: "${roleName}"`, {
        details: { roleName },
      });
    }
    return roleId;
  } catch (error) {
    logError(`Error validating role by name "${roleName}":`, {
      error: error.message,
      stack: error.stack,
    });
    throw error instanceof AppError
      ? error
      : AppError.databaseError('Failed to validate role by name', {
          details: { roleName },
        });
  }
};

/**
 * Validates the existence of a role by its ID.
 * @param {uuid} roleId - The ID of the role.
 * @returns {Promise<uuid>} - The role ID if valid.
 * @throws {AppError} - If the role does not exist or database operation fails.
 */
const validateRoleById = async (roleId) => {
  try {
    const validRoleId = await getRoleIdByField('id', roleId);
    if (!validRoleId) {
      throw AppError.validationError(`Invalid role ID: "${roleId}"`, {
        details: { roleId },
      });
    }
    return validRoleId;
  } catch (error) {
    logError(`Error validating role by ID "${roleId}":`, {
      error: error.message,
      stack: error.stack,
    });
    throw error instanceof AppError
      ? error
      : AppError.databaseError('Failed to validate role by ID', {
          details: { roleId },
        });
  }
};

/**
 * Validates the existence of a status by name.
 * @param {string} statusName - The name of the status.
 * @returns {Promise<uuid>} - The status ID if valid.
 * @throws {AppError} - If the status does not exist or database operation fails.
 */
const validateStatus = async (statusName) => {
  try {
    const statusId = await getStatusIdByName(statusName);
    if (!statusId) {
      throw AppError.validationError(`Invalid status: "${statusName}"`, {
        details: { statusName },
      });
    }
    return statusId;
  } catch (error) {
    logError(`Error validating status by name "${statusName}":`, {
      error: error.message,
      stack: error.stack,
    });
    throw error instanceof AppError
      ? error
      : AppError.databaseError('Failed to validate status', {
          details: { statusName },
        });
  }
};

module.exports = {
  validateUserExists,
  validateRoleByName,
  validateRoleById,
  validateStatus,
};
