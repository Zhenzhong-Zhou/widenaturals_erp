const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { query, getFieldsById } = require('../database/db');

/**
 * Fetches the ID of a role by its name or ID.
 *
 * @param {string} field - The field to search by ('name' or 'id').
 * @param {string} value - The value to search for (role name or ID).
 * @returns {Promise<uuid>} - The role ID if found.
 * @throws {AppError} - Throws an error if the role is not found or if the field is invalid.
 */
const getRoleIdByField = async (field, value) => {
  const validFields = ['name', 'id'];

  if (!validFields.includes(field)) {
    const errorMessage = `Invalid field: '${field}'. Must be one of ${validFields.join(', ')}`;
    logError(errorMessage, { field, value });
    throw AppError.validationError(errorMessage);
  }

  const text = `
    SELECT r.id
    FROM roles r
    INNER JOIN status s ON r.status_id = s.id
    WHERE r.${field} = $1
      AND s.name = 'active'
    LIMIT 1;
  `;

  const params = [field === 'name' ? value.toLowerCase() : value];

  try {
    const result = await query(text, params);

    if (result.rows.length === 0) {
      throw AppError.notFoundError(`Role with ${field} '${value}' not found.`);
    }

    return result.rows[0].id;
  } catch (error) {
    logError('Error fetching role ID by field:', {
      field,
      value,
      error: error.message,
    });
    throw AppError.databaseError('Failed to fetch role ID.');
  }
};

/**
 * Retrieves the name of a role by its ID.
 *
 * This function fetches the `name` field from the `roles` table for the given role ID.
 * Delegates to the generic `getFieldsById` helper.
 *
 * @param {string} id - UUID of the role to fetch.
 * @param {object} client - PostgreSQL client for transactional context.
 * @returns {Promise<{ name: string }>} - An object containing the role name.
 *
 * @throws {AppError} - If the role is not found or the query fails.
 */
const getRoleNameById = async (id, client) => {
  return await getFieldsById('roles', id, ['name'], client);
};

module.exports = {
  getRoleIdByField,
  getRoleNameById,
};
