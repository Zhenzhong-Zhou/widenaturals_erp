const { withTransaction } = require('../database/db');
const {
  evaluateUserVisibilityAccessControl,
  applyUserListVisibilityRules,
  sliceUserForUser,
} = require('../business/user-business');
const {
  insertUser,
  getUser,
  getPaginatedUsers,
} = require('../repositories/user-repository');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { transformPaginatedUserForViewResults } = require('../transformers/user-transformer');
const AppError = require('../utils/AppError');
const { insertUserAuth } = require('../repositories/user-auth-repository');
const { logError } = require('../utils/logger-helper');
const { hashPasswordWithSalt } = require('../utils/password-helper');

/**
 * Service: Fetch paginated users for UI consumption.
 *
 * Responsibilities:
 * - Resolve visibility authority for the requesting user
 * - Translate ACL decisions into repository-consumable visibility filters
 * - Orchestrate paginated repository queries
 * - Defensively enforce per-row visibility constraints (safety net)
 * - Normalize empty result sets
 * - Transform records into UI-ready response shapes
 * - Emit structured success and failure logs
 *
 * Visibility enforcement model:
 * - Repository-level filtering is the PRIMARY enforcement mechanism
 * - Service-level filter adjustment translates ACL → SQL intent
 * - Per-row slicing is DEFENSIVE only and must never broaden visibility
 *
 * This service DOES:
 * - Apply visibility rules via applyUserListVisibilityRules()
 * - Pass visibility-adjusted filters to the repository
 * - Enforce ACTIVE-only visibility when required
 *
 * This service DOES NOT:
 * - Grant or infer permissions
 * - Bypass repository visibility rules
 * - Perform business-specific response shaping
 * - Infer visibility from roles or identity flags
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Normalized filtering criteria (pre-ACL)
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Records per page
 * @param {string} [options.sortBy='u.created_at'] - SQL-safe sort column
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction
 * @param {'list'|'card'} [options.viewMode='list'] - UI presentation mode
 * @param {Object} options.user - Authenticated requester context
 *
 * @returns {Promise<{
 *   data: Object[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>}
 */
const fetchPaginatedUsersService = async ({
                                            filters = {},
                                            page = 1,
                                            limit = 10,
                                            sortBy = 'u.created_at',
                                            sortOrder = 'DESC',
                                            viewMode = 'list',
                                            user,
                                          }) => {
  const context = 'user-service/fetchPaginatedUsersService';
  
  try {
    // ---------------------------------------------------------
    // Step 0 — Resolve visibility access control
    // ---------------------------------------------------------
    const access = await evaluateUserVisibilityAccessControl(user);
    
    // ---------------------------------------------------------
    // Step 1 — Apply visibility rules to filters (CRITICAL)
    // ---------------------------------------------------------
    const adjustedFilters = applyUserListVisibilityRules(filters, access);
    
    // ---------------------------------------------------------
    // Step 2 — Query raw data from repository
    // ---------------------------------------------------------
    const rawResult = await getPaginatedUsers({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // ---------------------------------------------------------
    // Step 3 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No user records found', {
        context,
        filters: adjustedFilters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
        viewMode,
      });
      
      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }
    
    // ---------------------------------------------------------
    // Step 4 — Defensive per-row visibility (minimal)
    // ---------------------------------------------------------
    const visibleRows = rawResult.data
      .map((row) => sliceUserForUser(row, access))
      .filter(Boolean);
    
    // ---------------------------------------------------------
    // Step 5 — Transform for UI consumption
    // ---------------------------------------------------------
    const result = await transformPaginatedUserForViewResults(
      {
        ...rawResult,
        data: visibleRows,
      },
      viewMode
    );
    
    // ---------------------------------------------------------
    // Step 6 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Paginated user records fetched', {
      context,
      filters: adjustedFilters,
      pagination: result.pagination,
      sort: { sortBy, sortOrder },
      viewMode,
      count: result.data?.length,
    });
    
    return result;
  } catch (error) {
    // ---------------------------------------------------------
    // Step 7 — Log + rethrow
    // ---------------------------------------------------------
    logSystemException(error, 'Failed to fetch paginated user records', {
      context,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
      viewMode,
      userId: user?.id,
    });
    
    throw AppError.serviceError(
      'Unable to retrieve user records at this time. Please try again later.',
      { context }
    );
  }
};

/**
 * Creates a new user with authentication details.
 *
 * @param {object} userDetails - Details of the user to create.
 * @returns {Promise<object>} - The created user object.
 * @throws {AppError} - Throws an error if user creation fails.
 */
const createUser = async (userDetails) => {
  return await withTransaction(async (client) => {
    try {
      // Insert the user into the database
      const user = await insertUser(client, userDetails);
      const { passwordHash, passwordSalt } = await hashPasswordWithSalt(
        userDetails.password
      );

      // Insert authentication details for the user
      await insertUserAuth(client, {
        userId: user.id,
        passwordHash,
        passwordSalt,
      });

      // Return the created user
      return user;
    } catch (error) {
      logError('Error creating user:', error);
      throw error instanceof AppError
        ? error
        : new AppError('Failed to create user', 500, { type: 'DatabaseError' });
    }
  });
};

/**
 * Retrieves a user's profile by their ID.
 *
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<Object>} - The user's profile information.
 * @throws {AppError} - If the user ID is invalid or the user is not found.
 */
const getUserProfileById = async (userId) => {
  // Validate the input
  if (!userId || typeof userId !== 'string') {
    throw AppError.validationError('Invalid user ID provided');
  }

  try {
    // Fetch user profile from the repository
    const user = await getUser(null, 'id', userId);

    if (!user) {
      throw AppError.notFoundError(`User with ID ${userId} not found`);
    }

    // Map and return the user profile
    return mapUserProfile(user);
  } catch (error) {
    // Log the error with additional context
    logError(`Error retrieving user profile for ID ${userId}:`, {
      userId,
      error: error.message,
      stack: error.stack,
    });

    // Rethrow known errors or wrap unknown errors
    if (error instanceof AppError) {
      throw error;
    }

    throw AppError.serviceError(
      'An unexpected error occurred while fetching the user profile'
    );
  }
};

/**
 * Maps a user database record to a user profile response object.
 *
 * @param {Object} user - The user record from the database.
 * @returns {Object} - The mapped user profile.
 */
const mapUserProfile = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role_name,
  firstname: user.firstname,
  lastname: user.lastname,
  phone_number: user.phone_number,
  job_title: user.job_title,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

module.exports = {
  fetchPaginatedUsersService,
  createUser,
  getUserProfileById
};
