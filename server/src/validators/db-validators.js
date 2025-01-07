const { query } = require('../database/db');
const { getRoleIdByField } = require('../repositories/role-repository');
const { getStatusIdByName } = require('../repositories/status-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/app-error');

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
    logError(`Error checking email existence for ${email}:`, error);
    throw new AppError('Failed to check email existence', 500, {
      type: 'DatabaseError',
    });
  }
};

/**
 * Validates the existence of a role by its name.
 * @param {string} roleName - The name of the role.
 * @returns {Promise<uuid>} - The role ID if valid.
 * @throws {AppError} - If the role does not exist.
 */
const validateRoleByName = async (roleName) => {
  try {
    const roleId = await getRoleIdByField('name', roleName);
    if (!roleId) {
      throw new AppError(`Invalid role: "${roleName}"`, 400, {
        type: 'ValidationError',
        isExpected: true,
      });
    }
    return roleId;
  } catch (error) {
    logError(`Error validating role by name "${roleName}":`, error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to validate role by name', 500, {
        type: 'DatabaseError',
      });
  }
};

/**
 * Validates the existence of a role by its ID.
 * @param {uuid} roleId - The ID of the role.
 * @returns {Promise<uuid>} - The role ID if valid.
 * @throws {AppError} - If the role does not exist.
 */
const validateRoleById = async (roleId) => {
  try {
    const validRoleId = await getRoleIdByField('id', roleId);
    if (!validRoleId) {
      throw new AppError(`Invalid role ID: "${roleId}"`, 400, {
        type: 'ValidationError',
        isExpected: true,
      });
    }
    return validRoleId;
  } catch (error) {
    logError(`Error validating role by ID "${roleId}":`, error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to validate role by ID', 500, {
        type: 'DatabaseError',
      });
  }
};

/**
 * Validates the existence of a status by name.
 * @param {string} statusName - The name of the status.
 * @returns {Promise<uuid>} - The status ID if valid.
 * @throws {AppError} - If the status is invalid.
 */
const validateStatus = async (statusName) => {
  try {
    const statusId = await getStatusIdByName(statusName);
    if (!statusId) {
      throw new AppError(`Invalid status: "${statusName}"`, 400, {
        type: 'ValidationError',
        isExpected: true,
      });
    }
    return statusId;
  } catch (error) {
    logError(`Error validating status by name "${statusName}":`, error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to validate status', 500, {
        type: 'DatabaseError',
      });
  }
};

module.exports = {
  emailExists,
  validateRoleByName,
  validateRoleById,
  validateStatus,
};
