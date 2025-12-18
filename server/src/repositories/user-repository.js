const {
  query,
  retry,
  lockRow,
  getClient,
  paginateResults,
} = require('../database/db');
const { logError, logWarn } = require('../utils/logger-helper');
const {
  maskSensitiveInfo,
  maskField,
} = require('../utils/sensitive-data-utils');
const AppError = require('../utils/AppError');
const { buildUserFilter } = require('../utils/sql/build-user-filters');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

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
        throw AppError.conflictError('User already exists');
      }

      return result.rows[0];
    });
  } catch (error) {
    logError('Error inserting user:', error);
    throw AppError.databaseError('Failed to insert user');
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
    throw AppError.validationError('Invalid field for user query');
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
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN status s ON u.status_id = s.id
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
    throw AppError.databaseError(`Failed to fetch user by ${maskedField}`);
  } finally {
    // Release the client if it was created internally
    if (!isExternalClient && internalClient) {
      internalClient.release();
    }
  }
};

/**
 * Fetch paginated user records with optional filtering and sorting.
 *
 * Repository responsibility:
 * - Execute SQL queries to retrieve user records
 * - Apply precomputed filter conditions
 * - Return paginated raw rows for service-layer processing
 *
 * Architectural notes:
 * - Visibility and access control rules are enforced upstream
 *   and expressed via injected filter flags
 * - This function does NOT interpret permissions or roles
 * - Sorting fields are assumed SQL-safe and pre-validated
 *
 * Designed for:
 * - Administrative user list views
 * - Card and table-based directory UIs
 *
 * @param {Object} options
 * @param {Object} [options.filters] - Normalized filter criteria
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Records per page
 * @param {string} [options.sortBy='created_at'] - SQL-safe sort column
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const getPaginatedUsers = async ({
                                   filters = {},
                                   page = 1,
                                   limit = 10,
                                   sortBy = 'created_at',
                                   sortOrder = 'DESC',
}) => {
  const context = 'user-repository/getPaginatedUsers';
  
  // ------------------------------------
  // 1. Build WHERE clause from filters
  // ------------------------------------
  const { whereClause, params } = buildUserFilter(filters);
  
  // ------------------------------------
  // 2. Construct base query
  // ------------------------------------
  const queryText = `
    SELECT
      u.id,
      u.firstname,
      u.lastname,
      u.email,
      u.phone_number,
      u.job_title,
      u.created_at,
      u.created_by,
      cb.firstname AS created_by_firstname,
      cb.lastname AS created_by_lastname,
      u.updated_at,
      u.updated_by,
      ub.firstname AS updated_by_firstname,
      ub.lastname AS updated_by_lastname,
      u.role_id,
      r.name AS role_name,
      u.status_id,
      s.name AS status_name,
      u.status_date,
      ui.image_url AS avatar_url
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    LEFT JOIN status s ON s.id = u.status_id
    LEFT JOIN users cb ON cb.id = u.created_by
    LEFT JOIN users ub ON ub.id = u.updated_by
    LEFT JOIN (
      SELECT
        user_id,
        image_url
      FROM user_images
      WHERE is_primary = TRUE
    ) ui ON ui.user_id = u.id
     WHERE ${whereClause}
     ORDER BY ${sortBy} ${sortOrder};
  `;

  try {
    // ------------------------------------
    // 4. Execute paginated query
    // ------------------------------------
    const result = await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
      meta: { context },
    });
    
    // ------------------------------------
    // 5. Success logging
    // ------------------------------------
    logSystemInfo('Fetched paginated user records successfully', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      count: result.data.length,
    });
    
    return result;
  } catch (error) {
    // ------------------------------------
    // 6. Error handling
    // ------------------------------------
    logSystemException(error, 'Failed to fetch paginated user records', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch paginated user records.', {
      context,
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
    throw AppError.validationError('Invalid field for user existence check');
  }

  // SQL query with dynamic field and status filter
  const sql = `
    SELECT 1
    FROM users u
    INNER JOIN status s ON u.status_id = s.id
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
    throw AppError.databaseError(
      `Failed to check user existence by ${maskedField}`
    );
  }
};

module.exports = {
  insertUser,
  getUser,
  getPaginatedUsers,
  userExists,
};
