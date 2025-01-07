const { query } = require('../database/db');
const {  getRoleIdByField } = require('../repositories/role-repository');
const { getStatusIdByName } = require('../repositories/status-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/app-error');

/**
 * Check if an email exists in the database
 * @param {string} email - Email to validate
 * @returns {Promise<boolean>} - True if email exists, otherwise false
 */
const emailExists = async (email) => {
  const result = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  return result.rowCount > 0;
};

/**
 * Validates the existence of a role by its name.
 *
 * @param {string} roleName - The name of the role.
 * @returns {Promise<uuid>} - The role ID if valid.
 * @throws {Error} - If the role does not exist.
 */
const validateRoleByName = async (roleName) => {
  const roleId = await getRoleIdByField('name', roleName);
  if (!roleId) {
    const errorMessage = `Invalid role: ${roleName}`;
    logError(errorMessage);
    throw new Error(`Role with name "${roleName}" does not exist.`);
  }
  return roleId;
};

/**
 * Validates the existence of a role by its ID.
 *
 * @param {uuid} roleId - The ID of the role.
 * @returns {Promise<uuid>} - The role ID if valid.
 * @throws {Error} - If the role does not exist.
 */
const validateRoleById = async (roleId) => {
  const validRoleId = await getRoleIdByField('id', roleId);
  if (!validRoleId) {
    throw new AppError(
      `Validation: Role with ID "${roleId}" does not exist.`,
      400, // HTTP status code
      { type: 'Validation', isExpected: true } // Additional error metadata
    );
  }
  return validRoleId;
};

/**
 * Validates the existence of a status by name.
 *
 * @param {string} statusName - The name of the status.
 * @returns {Promise<uuid>} - The status ID if valid.
 * @throws {Error} - If the status is invalid.
 */
const validateStatus = async (statusName) => {
  const statusId = await getStatusIdByName(statusName);
  if (!statusId) {
    throw new Error(`Invalid status: ${statusName}`);
  }
  return statusId;
};

module.exports = {
  emailExists,
  validateRoleByName,
  validateRoleById,
  validateStatus,
};
