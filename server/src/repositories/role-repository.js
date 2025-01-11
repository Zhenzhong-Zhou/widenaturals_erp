const AppError = require('../utils/app-error');
const { logError } = require('../utils/logger-helper');
const { query } = require('../database/db');

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
    throw new AppError(errorMessage, 400, {
      type: 'ValidationError',
      isExpected: true,
    });
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
      throw new AppError(`Role with ${field} '${value}' not found.`, 404, {
        type: 'DatabaseError',
        isExpected: true,
      });
    }

    return result.rows[0].id;
  } catch (error) {
    logError('Error fetching role ID by field:', {
      field,
      value,
      error: error.message,
    });
    throw new AppError('Failed to fetch role ID.', 500, {
      type: 'DatabaseError',
      isExpected: false,
    });
  }
};

module.exports = { getRoleIdByField };
