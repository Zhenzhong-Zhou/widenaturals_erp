const { withTransaction } = require('../database/db');
const {
  evaluateUserCreationAccessControl,
  evaluateUserVisibilityAccessControl,
  applyUserListVisibilityRules,
  sliceUserForUser,
  evaluateUserProfileAccessControl,
  sliceUserProfileForUser,
  evaluateUserRoleViewAccessControl,
  sliceUserRoleForUser,
} = require('../business/user-business');
const {
  insertUser,
  getPaginatedUsers,
  getUserProfileById,
} = require('../repositories/user-repository');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  transformPaginatedUserForViewResults,
  transformUserProfileRow,
  transformUserInsertResult,
} = require('../transformers/user-transformer');
const AppError = require('../utils/AppError');
const { insertUserAuth } = require('../repositories/user-auth-repository');
const { getStatusId } = require('../config/status-cache');
const { hashPassword } = require('../business/user-auth-business');
const { classifyRole } = require('../business/roles/role-semantics');
const { getRoleById } = require('../repositories/role-repository');

/**
 * Creates a new user with authentication credentials.
 *
 * Service-layer orchestration function.
 *
 * Responsibilities:
 * - Enforces user-creation ACL and role assignment rules
 * - Resolves and validates target role semantics
 * - Hashes plaintext password securely before persistence
 * - Creates user and authentication records atomically
 * - Initializes newly created users in an inactive status
 * - Emits structured audit logs
 *
 * Transactional guarantees:
 * - User and user_auth records are created in the same transaction
 * - Partial writes are impossible (all-or-nothing)
 *
 * Explicitly NOT handled here:
 * - Input shape validation (handled by route schema / Joi)
 * - Role hierarchy traversal (pending hierarchy_level implementation)
 * - Conflict resolution (delegated to DB constraints)
 * - Presentation-layer transformation beyond insert result mapping
 *
 * Security notes:
 * - Role semantics are resolved via `classifyRole` only
 * - Privilege escalation is prevented via ACL checks
 * - Passwords are never persisted or logged in plaintext
 * - Newly created users are inactive until explicitly activated
 *
 * @param {Object} input - User creation payload (validated upstream)
 * @param {Object} actor - Authenticated user performing the action
 *
 * @returns {Promise<Object>} Newly created user record (DB truth)
 *
 * @throws {AppError}
 * - validationError: invalid or inactive role
 * - authorizationError: insufficient permission to create target role
 * - databaseError: unexpected persistence failure
 */
const createUserService = async (input, actor) => {
  const context = 'user-service/createUserService';
  
  return withTransaction(async (client) => {
    try {
      // ------------------------------------------------------------
      // 1. Resolve target role (single source of truth)
      // ------------------------------------------------------------
      const targetRole = await getRoleById(input.roleId, client);
      
      if (!targetRole || !targetRole.is_active) {
        throw AppError.validationError('Invalid or inactive role.');
      }
      
      const { isRootRole, isAdminRole, isSystemRole } =
        classifyRole(targetRole);
      
      // ------------------------------------------------------------
      // 2. ACL / permission check
      // ------------------------------------------------------------
      const access = await evaluateUserCreationAccessControl(actor);
      
      if (!access.canCreateUsers) {
        throw AppError.authorizationError(
          'You are not allowed to create users.'
        );
      }
      
      if (isSystemRole && !access.canCreateSystemUsers) {
        throw AppError.authorizationError(
          'You are not allowed to create system users.'
        );
      }
      
      if (isRootRole && !access.canCreateRootUsers) {
        throw AppError.authorizationError(
          'You are not allowed to create root users.'
        );
      }
      
      if (isAdminRole && !access.canCreateAdminUsers) {
        throw AppError.authorizationError(
          'You are not allowed to create admin users.'
        );
      }
      
      // TODO(role-hierarchy):
      // Replace name-based role semantics with hierarchy-based checks
      // once `hierarchy_level` and `parent_role_id` are finalized.
      // This MUST be implemented inside `classifyRole()` only.
      // Do not add inline hierarchy checks here.
      
      // ------------------------------------------------------------
      // 3. Hash password (outside DB write)
      // ------------------------------------------------------------
      const passwordHash = await hashPassword(input.password);
      
      const inactiveStatusId = getStatusId('general_inactive');
      
      // ------------------------------------------------------------
      // 4. Insert user
      // ------------------------------------------------------------
      const userRecord = await insertUser(
        {
          email: input.email,
          roleId: input.roleId,
          statusId: inactiveStatusId,
          firstname: input.firstname,
          lastname: input.lastname,
          phoneNumber: input.phoneNumber,
          jobTitle: input.jobTitle,
          note: input.note,
          createdBy: actor.id,
        },
        client
      );
      
      // ------------------------------------------------------------
      // 5. Insert auth (same transaction)
      // ------------------------------------------------------------
      await insertUserAuth({
        userId: userRecord.id,
        passwordHash,
      }, client);
      
      // ------------------------------------------------------------
      // 6. Transform & audit
      // ------------------------------------------------------------
      const transformed = transformUserInsertResult(userRecord);
      
      logSystemInfo('User created successfully', {
        context,
        userId: userRecord.id,
        createdBy: actor.id,
        roleId: targetRole.id,
      });
      
      return transformed;
    } catch (error) {
      logSystemException(error, 'Failed to create user', { context });
      
      throw error instanceof AppError
        ? error
        : AppError.databaseError('Failed to create user.', {
          cause: error,
          context,
        });
    }
  });
};

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
 * Service: Fetch complete user profile with permission filtering.
 *
 * Root entry point for the User Profile page.
 * Enforces server-side visibility to prevent ID-guessing
 * and client-side mistakes.
 *
 * Security & policy notes:
 * - Only ACTIVE users are directly accessible by profile ID
 * - Profile visibility is enforced per-request on the server
 * - Avatars are intentionally public and do not require ACL checks
 *
 * @param {string} userId - Target user UUID
 * @param {Object} requester - Authenticated user context
 * @returns {Promise<UserProfileDTO>}
 */
const fetchUserProfileService = async (userId, requester) => {
  const context = 'user-service/fetchUserProfileService';
  const traceId = `user-profile-${Date.now().toString(36)}`;

  try {
    const activeId = getStatusId('general_active');

    // --------------------------------------------------------
    // 1. Fetch base user profile record (ACTIVE users only)
    // --------------------------------------------------------
    // Inactive users are not directly accessible by profile ID.
    const userRow = await getUserProfileById(userId, activeId);

    if (!userRow) {
      throw AppError.notFoundError(`User not found: ${userId}`, { context });
    }

    // --------------------------------------------------------
    // 2. Profile-level visibility (block entire page if denied)
    // --------------------------------------------------------
    const profileAccess = await evaluateUserProfileAccessControl(
      requester,
      userId
    );

    const safeProfileRow = sliceUserProfileForUser(userRow, profileAccess);

    if (!safeProfileRow) {
      throw AppError.authorizationError(
        'You are not authorized to view this user profile.',
        { context, userId }
      );
    }

    // --------------------------------------------------------
    // 3. Role visibility (self OR permission)
    // --------------------------------------------------------
    const roleAccess = await evaluateUserRoleViewAccessControl(
      requester,
      profileAccess
    );

    const withRole = sliceUserRoleForUser(safeProfileRow, roleAccess);

    // --------------------------------------------------------
    // 4. Transform → API DTO
    // --------------------------------------------------------
    // Avatar visibility is intentionally public for all users.
    const response = transformUserProfileRow(withRole);

    // --------------------------------------------------------
    // 5. Structured logging
    // --------------------------------------------------------
    logSystemInfo('Fetched user profile', {
      context,
      traceId,
      targetUserId: userId,
      requesterId: requester?.id,
      isSelf: profileAccess.isSelf,
      roleVisible: Boolean(response?.role),
      avatarVisible: Boolean(response?.avatar),
      permissionCount: response?.role?.permissions?.length ?? 0,
    });

    return response;
  } catch (error) {
    logSystemException(error, 'Failed to fetch user profile', {
      context,
      traceId,
      targetUserId: userId,
      requesterId: requester?.id,
    });

    throw AppError.serviceError('Failed to fetch user profile', {
      details: error.message,
      context,
    });
  }
};

module.exports = {
  createUserService,
  fetchPaginatedUsersService,
  fetchUserProfileService,
};
