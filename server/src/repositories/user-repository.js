const { query, paginateResults, paginateQueryByOffset } = require('../database/db');
const { buildUserFilter } = require('../utils/sql/build-user-filters');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { logError } = require('../utils/logger-helper');
const {
  maskSensitiveInfo,
  maskField,
} = require('../utils/sensitive-data-utils');
const AppError = require('../utils/AppError');

/**
 * Inserts a new user record into the `users` table.
 *
 * Repository-layer function:
 * - Executes a single INSERT statement
 * - Relies on database constraints for integrity (UNIQUE, FK)
 * - Does NOT handle conflict resolution, retries, ACL, or business rules
 * - Throws raw database errors to preserve full error context
 *
 * User creation conflicts (e.g. duplicate email) are exceptional and
 * MUST be handled explicitly in the service / business layer.
 *
 * @param {Object} user - User data to insert.
 *
 * @param {Object} client - Database client or transaction.
 *
 * @returns {Promise<Object>} Inserted user summary.
 *
 * @throws {Error} Raw database errors:
 * - Unique constraint violations (email, phone)
 * - Foreign key violations (role, status)
 * - Other database-level failures
 */
const insertUser = async ( user, client) => {
  const context = 'user-repository/insertUser';
  
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
    updatedBy = null,
    updatedAt = null,
  } = user;
  
  const queryText = `
    INSERT INTO users (
      email,
      role_id,
      status_id,
      firstname,
      lastname,
      phone_number,
      job_title,
      note,
      status_date,
      created_by,
      updated_by,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING
      id,
      email,
      role_id,
      status_id,
      created_at;
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
    updatedBy,
    updatedAt,
  ];
  
  try {
    const { rows } = await query(queryText, params, client);
    
    logSystemInfo('User inserted successfully', {
      context,
      userId: rows[0]?.id,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to insert user', {
      context,
      email: maskSensitiveInfo(email, 'email'),
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Checks whether a user exists by a unique field, regardless of status.
 *
 * Repository-layer function:
 * - Performs a structural existence check only
 * - Does NOT apply status, visibility, or business rules
 * - Intended for conflict detection and bootstrap logic
 *
 * @param {'id'|'email'} field - Field to check uniqueness against.
 * @param {string} value - Field value to look up.
 * @param {Object} [client] - Optional DB client for transactional context.
 *
 * @returns {Promise<boolean>} True if a matching user exists.
 *
 * @throws {AppError} If the field is invalid or the query fails.
 */
const userExistsByField = async (field, value, client) => {
  const context = 'user-repository/userExistsByField';
  
  if (!['id', 'email'].includes(field)) {
    throw AppError.validationError(
      'Invalid field for user existence check.',
      { context, field }
    );
  }
  
  const queryText = `
    SELECT 1
    FROM users
    WHERE ${field} = $1
    LIMIT 1
  `;
  
  try {
    const { rowCount } = await query(queryText, [value], client);
    return rowCount > 0;
  } catch (error) {
    logSystemException(error, 'Failed to check user existence', {
      context,
      field,
    });
    
    throw AppError.databaseError('Failed to check user existence.', {
      cause: error,
      context,
    });
  }
};

/**
 * Checks whether an active user exists for the given email.
 *
 * Repository-layer function:
 * - Performs a structural existence check scoped by status_id
 * - Assumes status semantics are resolved by the caller
 * - Avoids JOINs and string-based status checks
 *
 * @param {string} email - User email to check.
 * @param {string} activeStatusId - Status ID representing "active".
 * @param {Object} [client] - Optional DB client for transactional context.
 *
 * @returns {Promise<boolean>} True if an active user exists.
 *
 * @throws {AppError} If the query fails.
 */
const activeUserExistsByEmail = async (email, activeStatusId, client) => {
  const context = 'user-repository/activeUserExistsByEmail';
  
  const queryText = `
    SELECT 1
    FROM users
    WHERE email = $1
      AND status_id = $2
    LIMIT 1
  `;
  
  try {
    const { rowCount } = await query(
      queryText,
      [email, activeStatusId],
      client
    );
    
    return rowCount > 0;
  } catch (error) {
    logSystemException(error, 'Failed to check active user existence', {
      context,
      email,
    });
    
    throw AppError.databaseError(
      'Failed to check active user existence.',
      { cause: error, context }
    );
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
 * Fetches a lightweight, paginated list of users for use in
 * dropdowns, autocomplete fields, or assignment workflows.
 *
 * This repository function intentionally returns a minimal payload
 * to optimize performance for UI lookup scenarios.
 *
 * ### Design principles
 * - Lookup endpoints must remain lightweight by default
 * - Avoid joins unless explicitly required and permitted
 * - Select only index-friendly, identifying fields
 *
 * ### Supported features
 * - Row-level filtering via `buildUserFilter`
 * - Keyword search on basic user fields
 * - Stable, deterministic sorting
 * - Offset-based pagination
 *
 * ### Permission-aware behavior
 * - Role and status joins are applied only when explicitly enabled
 *   via `options` (resolved by the service / ACL layer)
 *
 * @param {Object} [filters={}]
 *   Row-level filters passed to `buildUserFilter`
 *
 * @param {Object} [options={}]
 *   Query capability flags resolved by business / ACL logic
 *
 * @param {boolean} [options.canSearchRole=false]
 *   Allow keyword search against role name (requires role join)
 *
 * @param {boolean} [options.canSearchStatus=false]
 *   Allow keyword search against status name (requires status join)
 *
 * @param {number} [limit=50]
 *   Maximum number of rows to return
 *
 * @param {number} [offset=0]
 *   Number of rows to skip
 *
 * @returns {Promise<{
 *   data: Array<{
 *     id: string,
 *     email: string,
 *     firstname: string | null,
 *     lastname: string | null,
 *     status_id: string
 *   }>,
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number,
 *     hasMore: boolean
 *   }
 * }>}
 *
 * @throws {AppError} If the database query fails
 */
const getUserLookup = async ({
                               filters = {},
                               options = {},
                               limit = 50,
                               offset = 0,
                             }) => {
  const context = 'user-repository/getUserLookup';
  const tableName = 'users u';
  
  // Query capability flags (resolved by service / ACL layer)
  const {
    canSearchRole = false,
    canSearchStatus = false,
  } = options;
  
  // Lookup queries avoid joins unless explicitly required
  const joins = [];
  
  if (canSearchRole) {
    joins.push('LEFT JOIN roles r ON r.id = u.role_id');
  }
  
  if (canSearchStatus) {
    joins.push('LEFT JOIN status s ON s.id = u.status_id');
  }
  
  // Build WHERE clause with awareness of enabled capabilities
  const { whereClause, params } = buildUserFilter(filters, {
    canSearchRole,
    canSearchStatus,
  });
  
  const queryText = `
    SELECT
      u.id,
      u.email,
      u.firstname,
      u.lastname,
      u.status_id
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQueryByOffset({
      tableName,
      joins,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'u.firstname',
      sortOrder: 'ASC',
      additionalSort: 'u.lastname ASC, u.email ASC',
    });
    
    logSystemInfo('Fetched user lookup data', {
      context,
      offset,
      limit,
      filters,
      options,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch user lookup', {
      context,
      offset,
      limit,
      filters,
      options,
    });
    throw AppError.databaseError('Failed to fetch user lookup.');
  }
};

module.exports = {
  insertUser,
  userExistsByField,
  activeUserExistsByEmail,
  getPaginatedUsers,
  getUserProfileById,
  getUserLookup,
};
