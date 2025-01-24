const {
  query,
  retry,
  lockRow,
  getClient,
  paginateQuery,
} = require('../database/db');
const { logError, logWarn } = require('../utils/logger-helper');
const {
  maskSensitiveInfo,
  maskField,
} = require('../utils/sensitive-data-utils');
const AppError = require('../utils/AppError');

/**
 * Inserts a new user into the `users` table with retry logic for transient errors.
 *
 * @param {object} client - The database client.
 * @param {object} userDetails - User details to be inserted.
 * @returns {Promise<object>} - The inserted user details.
 * @throws {AppError} - Throws an error if the insertion fails or user already exists.
 */
const insertUser = async (client, userDetails) => {
  const {
    email,
    roleId,
    statusId,
    firstname,
    lastname,
    phoneNumber,
    jobTitle,
    note,
    statusDate,
    createdBy,
  } = userDetails;

  const sql = `
    INSERT INTO users (
      email, role_id, status_id, firstname, lastname, phone_number,
      job_title, note, status_date, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, role_id, status_id, created_at;
  `;
  const params = [
    email,
    roleId,
    statusId,
    firstname,
    lastname,
    phoneNumber,
    jobTitle,
    note,
    statusDate,
    createdBy,
  ];

  try {
    return await retry(async () => {
      const result = await client.query(sql, params);

      if (result.rows.length === 0) {
        const maskedEmail = maskSensitiveInfo(email, 'email');
        logWarn(`User with email ${maskedEmail} already exists.`);
        throw new AppError('User already exists', 409, {
          type: 'ConflictError',
          isExpected: true,
        });
      }

      return result.rows[0];
    });
  } catch (error) {
    logError('Error inserting user:', error);
    throw new AppError('Failed to insert user', 500, { type: 'DatabaseError' });
  }
};

/**
 * Fetches a user by a specific field (ID or email) and optionally locks the row.
 *
 * @param {object} client - The database client.
 * @param {string} field - The field to search by (`id` or `email`).
 * @param {string} value - The value of the field.
 * @param {boolean} shouldLock - Whether to lock the row for update (default: false).
 * @returns {Promise<object|null>} - The user record or null if not found.
 * @throws {AppError} - Throws an error for invalid fields or database issues.
 */
const getUser = async (client, field, value, shouldLock = false) => {
  const maskedField = maskField(field, value);

  if (!['id', 'email'].includes(field)) {
    throw new AppError('Invalid field for user query', 400, {
      type: 'ValidationError',
      isExpected: true,
    });
  }

  const sql = `
    SELECT
      u.id,
      u.email,
      u.role_id,
      r.name AS role_name,
      u.status_id,
      s.name AS status_name,
      u.firstname,
      u.lastname,
      u.phone_number,
      u.job_title,
      u.note,
      u.status_date,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN status s ON u.status_id = s.id
    WHERE u.${field} = $1
  `;
  const params = [value];

  let isExternalClient = !!client; // Determine if the client was passed in
  let internalClient;

  try {
    // Use the provided client or create a new one
    internalClient = client || (await getClient());

    const user = await retry(async () => {
      const result = await internalClient.query(sql, params);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    });

    // Optionally lock the user's row to ensure consistency
    if (shouldLock && user) {
      await lockRow(internalClient, 'users', user.id, 'FOR UPDATE');
    }

    return user;
  } catch (error) {
    logError(`Error fetching user by ${maskedField}:`, error);
    throw new AppError(`Failed to fetch user by ${maskedField}`, 500, {
      type: 'DatabaseError',
    });
  } finally {
    // Release the client if it was created internally
    if (!isExternalClient && internalClient) {
      internalClient.release();
    }
  }
};

/**
 * Fetches all users with pagination.
 *
 * @param {Object} options - Options for pagination and filtering.
 * @param {number} options.page - The page number to fetch.
 * @param {number} options.limit - The number of records per page.
 * @param {string} options.sortBy - Column to sort by.
 * @param {string} options.sortOrder - Sort order ('ASC' or 'DESC').
 * @returns {Promise<Object>} Paginated users and metadata.
 */
const getAllUsers = async ({ page, limit, sortBy, sortOrder }) => {
  const tableName = 'users u';
  const joins = ['LEFT JOIN status s ON u.status_id = s.id'];
  const whereClause = "s.name = 'active'";

  // Construct SQL query parts
  const queryText = `
    SELECT
      u.email,
      r.name AS role_name,
      CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, '')) AS fullname,
      u.phone_number,
      u.job_title
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN status s ON u.status_id = s.id
    WHERE s.name = 'active'
  `;

  try {
    return await retry(
      async () =>
        await paginateQuery({
          tableName,
          joins,
          whereClause,
          queryText,
          params: [],
          page,
          limit,
          sortBy,
          sortOrder,
        })
    );
  } catch (error) {
    logError('Error executing paginated query in repository:', error);
    throw new AppError('Failed to fetch users from repository', 500, {
      type: 'DatabaseError',
      details: error.message,
    });
  }
};

/**
 * Checks if a user exists in the database by a specific field and value.
 *
 * The function filters by the user's status (default is 'active').
 *
 * @param {string} field - The field to search by (e.g., 'id' or 'email').
 * @param {string} value - The value of the field.
 * @param {string} [status='active'] - The status to filter by (default is 'active').
 * @returns {Promise<boolean>} - True if the user exists and matches the status, false otherwise.
 * @throws {AppError} - If the field is invalid or the query fails.
 */
const userExists = async (field, value, status = 'active') => {
  const maskedField = maskField(field, value);

  // Validate the field
  if (!['id', 'email'].includes(field)) {
    throw new AppError('Invalid field for user existence check', 400, {
      type: 'ValidationError',
      isExpected: true,
    });
  }

  // SQL query with dynamic field and status filter
  const sql = `
    SELECT 1
    FROM users u
    LEFT JOIN status s ON u.status_id = s.id
    WHERE u.${field} = $1
      AND s.name = $2
    LIMIT 1
  `;

  const params = [value, status];

  try {
    const result = await query(sql, params);
    return result.rowCount > 0; // Return true if the user exists and matches the status
  } catch (error) {
    logError(`Error checking user existence by ${maskedField}:`, error);
    throw new AppError(
      `Failed to check user existence by ${maskedField}`,
      500,
      {
        type: 'DatabaseError',
      }
    );
  }
};

/**
 * Updates a user's details partially.
 */
const updateUserPartial = async (id, updates) => {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index++;
  }
  values.push(id); // Add ID as the last parameter

  const sql = `
    UPDATE users
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${index}
    RETURNING *;
  `;

  try {
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new AppError('User not found for update', 404, {
        type: 'NotFoundError',
        isExpected: true,
      });
    }

    return result.rows[0];
  } catch (error) {
    logError('Error updating user partially:', error);
    throw new AppError('Failed to update user', 500, { type: 'DatabaseError' });
  }
};

/**
 * Deletes a user by their ID.
 */
const deleteUser = async (id) => {
  const sql = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id;
  `;
  const params = [id];

  try {
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new AppError('User not found for deletion', 404, {
        type: 'NotFoundError',
        isExpected: true,
      });
    }

    return true;
  } catch (error) {
    logError('Error deleting user:', error);
    throw new AppError('Failed to delete user', 500, { type: 'DatabaseError' });
  }
};

module.exports = {
  insertUser,
  getUser,
  getAllUsers,
  userExists,
  updateUserPartial,
  deleteUser,
};
