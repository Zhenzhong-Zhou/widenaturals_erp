const { query } = require('../database/db');
const { getRoleIdByField } = require('../repositories/role-repository');
const { getStatusIdByName } = require('../repositories/status-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { getUser, userExists } = require('../repositories/user-repository');
const { isPasswordReused, fetchPasswordHistory } = require('../repositories/user-auth-repository');

/**
 * Check if an email exists in the database.
 * @param {string} email - Email to validate.
 * @returns {Promise<boolean>} - True if email exists, otherwise false.
 */
const emailExists = async (email) => {
  try {
    const result = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    return result.rowCount > 0;
  } catch (error) {
    logError(`Error checking email existence for ${email}:`, {
      error: error.message,
      stack: error.stack,
    });
    throw AppError.databaseError('Failed to check email existence', {
      details: { email },
    });
  }
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

/**
 * Validates if a user exists by their ID.
 *
 * @param {string} userId - The ID of the user to validate.
 * @returns {Promise<Object>} - The user record if it exists.
 * @throws {AppError} - If the user does not exist.
 */
const validateUserExists = async (userId) => {
  const user = await userExists('id', userId);
  
  if (!user) {
    throw AppError.notFoundError(`User with ID ${userId} not found.`);
  }
  return user;
};

/**
 * Validates if a given password has been reused by the user.
 *
 * This function checks the password history in the database to prevent
 * users from reusing any of their previous passwords.
 *
 * @param {string} userId - The ID of the user to check.
 * @param {string} newPassword - The plain-text password to validate.
 * @returns {Promise<void>} - Throws an error if the password is reused.
 * @throws {AppError} - Throws a validation error if the password is reused.
 */
const validatePasswordReused = async (userId, newPassword) => {
  try {
    const isReused = await isPasswordReused(userId, newPassword);
    
    if (isReused) {
      throw new AppError('New password cannot be the same as a previous password.', 400, {
          type: 'ValidationError',
          isExpected: true,
      });
    }
    return true;
  } catch (error) {
    logError('Error validating password reuse:', error);
    throw error;
  }
};

module.exports = {
  emailExists,
  validateRoleByName,
  validateRoleById,
  validateStatus,
  validateUserExists,
  validatePasswordReused
};
