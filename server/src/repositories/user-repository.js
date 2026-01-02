const { query, retry, paginateResults } = require('../database/db');
const { buildUserFilter } = require('../utils/sql/build-user-filters');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
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
 * Repository: Fetch a single User Profile with complete identity context.
 *
 * This function retrieves:
 *   - Core user identity fields
 *   - User status metadata
 *   - Role metadata
 *   - Derived (read-only) role permissions
 *   - Primary avatar (if exists)
 *   - Audit metadata
 *
 * IMPORTANT:
 *   Does NOT include:
 *     - Authentication data (passwords, sessions, tokens)
 *     - Security state (lockouts, login attempts)
 *     - Activity / audit history
 *
 * Performance:
 *   - Single-user lookup via PK filter `u.id = $1`
 *   - Permissions aggregated once per role
 *   - Avatar resolved via partial unique index
 *
 * Error Handling:
 *   - Returns `null` if user does not exist
 *   - Throws `AppError.databaseError` on DB failures
 *
 * @param {string} userId - UUID of the user
 * @param {string} activeStatusId - UUID of the "active" status
 * @returns {Promise<Object|null>} User profile row or null if not found
 */
const getUserProfileById = async (userId, activeStatusId) => {
  const context = 'user-repository/getUserProfileById';

  const queryText = `
    WITH role_permissions_agg AS (
      SELECT
        rp.role_id,
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'key', p.key,
            'name', p.name
          )
          ORDER BY p.key
        ) AS permissions
      FROM role_permissions rp
      JOIN permissions p
        ON p.id = rp.permission_id
       AND p.status_id = $2
      WHERE rp.status_id = $2
      GROUP BY rp.role_id
    )

    SELECT
      u.id,
      u.email,
      u.firstname,
      u.lastname,
      u.phone_number,
      u.job_title,
      u.is_system,
      s.id   AS status_id,
      s.name AS status_name,
      u.status_date,
      r.id           AS role_id,
      r.name         AS role_name,
      r.role_group,
      r.hierarchy_level,
      COALESCE(rpa.permissions, '[]'::jsonb) AS permissions,
      ui.image_url   AS avatar_url,
      ui.file_format AS avatar_format,
      ui.uploaded_at AS avatar_uploaded_at,
      u.created_at,
      u.updated_at,
      u.created_by,
      cu.firstname AS created_by_firstname,
      cu.lastname  AS created_by_lastname,
      u.updated_by,
      uu.firstname AS updated_by_firstname,
      uu.lastname  AS updated_by_lastname
    FROM users u
    JOIN status s ON s.id = u.status_id
    LEFT JOIN roles r ON r.id = u.role_id
    LEFT JOIN role_permissions_agg rpa ON rpa.role_id = r.id
    LEFT JOIN user_images ui ON ui.user_id = u.id AND ui.is_primary = TRUE
    LEFT JOIN users cu ON cu.id = u.created_by
    LEFT JOIN users uu ON uu.id = u.updated_by
    WHERE u.id = $1
  `;

  try {
    const { rows } = await query(queryText, [userId, activeStatusId]);

    if (rows.length === 0) {
      logSystemInfo('No user profile found for given ID', {
        context,
        userId,
      });
      return null;
    }

    logSystemInfo('Fetched user profile successfully', {
      context,
      userId,
    });

    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch user profile', {
      context,
      userId,
      error: error.message,
    });

    throw AppError.databaseError('Failed to fetch user profile', {
      context,
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
  getPaginatedUsers,
  getUserProfileById,
  userExists,
};
