/**
 * @file user-service.js
 * @description Business logic for user creation, retrieval, and profile access.
 *
 * Exports:
 *   - createUserService           – creates a user with auth record and role validation
 *   - fetchPaginatedUsersService  – paginated user list with visibility scoping
 *   - fetchUserProfileService     – single user profile with permission-filtered fields
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction }                    = require('../database/db');
const {
  evaluateUserCreationAccessControl,
  evaluateUserVisibilityAccessControl,
  applyUserListVisibilityRules,
  sliceUserForUser,
  evaluateUserProfileAccessControl,
  sliceUserProfileForUser,
  evaluateUserRoleViewAccessControl,
  sliceUserRoleForUser,
}                                            = require('../business/user-business');
const {
  insertUser,
  getPaginatedUsers,
  getUserProfileById,
}                                            = require('../repositories/user-repository');
const {
  transformPaginatedUserForViewResults,
  transformUserProfileRow,
  transformUserInsertResult,
}                                            = require('../transformers/user-transformer');
const AppError                               = require('../utils/AppError');
const { insertUserAuth }                     = require('../repositories/user-auth-repository');
const { getStatusId }                        = require('../config/status-cache');
const { hashPassword }                       = require('../utils/password-utils');
const { classifyRole }                       = require('../utils/role-classifier');
const { getRoleById }                        = require('../repositories/role-repository');

const CONTEXT = 'user-service';

/**
 * Creates a new user with a linked auth record inside a single transaction.
 *
 * Resolves the target role, evaluates ACL, determines initial status,
 * hashes the password, inserts the user and auth records atomically.
 *
 * Initial status is a service invariant — callers must not control it.
 * Bootstrap root users start active; all other API-created users start inactive.
 *
 * @param {CreateUserPayload} input - User creation payload.
 * @param {AuthUser | SystemActor} actor - User or system actor performing the action.
 * @param {string} actor.id
 * @param {boolean} [actor.isBootstrap=false]
 * @param {boolean} [actor.isRoot=false]
 *
 * @returns {Promise<Object>} Transformed insert result.
 *
 * @throws {AppError} `validationError`    – invalid or inactive role.
 * @throws {AppError} `authorizationError` – actor lacks permission to create this user type.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createUserService = async (input, actor) => {
  const context = `${CONTEXT}/createUserService`;
  
  return withTransaction(async (client) => {
    try {
      // 1. Resolve target role — single source of truth for role semantics.
      const targetRole = await getRoleById(input.roleId, client);
      
      if (!targetRole || !targetRole.is_active) {
        throw AppError.validationError('Invalid or inactive role.');
      }
      
      const { isRootRole, isAdminRole, isSystemRole } = classifyRole(targetRole);
      
      // 2. Evaluate ACL — check actor has permission to create this user type.
      const access = await evaluateUserCreationAccessControl(actor);
      
      if (!access.canCreateUsers) {
        throw AppError.authorizationError('You are not allowed to create users.');
      }
      
      if (isSystemRole && !access.canCreateSystemUsers) {
        throw AppError.authorizationError('You are not allowed to create system users.');
      }
      
      if (isRootRole && !access.canCreateRootUsers) {
        throw AppError.authorizationError('You are not allowed to create root users.');
      }
      
      if (isAdminRole && !access.canCreateAdminUsers) {
        throw AppError.authorizationError('You are not allowed to create admin users.');
      }
      
      // TODO(role-hierarchy): Replace name-based role semantics with hierarchy-based
      // checks once `hierarchy_level` and `parent_role_id` are finalised.
      // Must be implemented inside `classifyRole()` only — no inline checks here.
      
      // 3. Determine initial status — service invariant, callers must not control this.
      let statusId;
      
      if (actor?.isBootstrap === true && actor?.isRoot === true) {
        // Bootstrap-only exception: initial root admin starts active.
        statusId = getStatusId('general_active');
      } else {
        // All normal API-created users start inactive.
        statusId = getStatusId('general_inactive');
      }
      
      // 4. Hash password outside the DB write to avoid holding the transaction open.
      const passwordHash = await hashPassword(input.password);
      
      // 5. Insert user record.
      const userRecord = await insertUser(
        {
          email:       input.email,
          roleId:      input.roleId,
          statusId,
          firstname:   input.firstname,
          lastname:    input.lastname,
          phoneNumber: input.phoneNumber,
          jobTitle:    input.jobTitle,
          note:        input.note,
          createdBy:   actor.id,
        },
        client
      );
      
      // 6. Insert auth record in the same transaction for atomicity.
      await insertUserAuth({ userId: userRecord.id, passwordHash }, client);
      
      // 7. Transform and return.
      return transformUserInsertResult(userRecord);
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw AppError.serviceError('Unable to create user.', {
        context,
        meta: { error: error.message },
      });
    }
  });
};

/**
 * Fetches paginated user records scoped to the requesting user's visibility.
 *
 * Evaluates access control, applies visibility rules to filters, queries
 * the repository, applies per-row slicing, and transforms results for UI consumption.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]           - Field filters to apply.
 * @param {number}        [options.page=1]               - Page number (1-based).
 * @param {number}        [options.limit=10]             - Records per page.
 * @param {string}        [options.sortBy='createdAt']   - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']     - Sort direction.
 * @param {string}        [options.viewMode='list']      - View mode passed to transformer.
 * @param {Object}        options.user                   - Authenticated user.
 *
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedUsersService = async ({
                                            filters   = {},
                                            page      = 1,
                                            limit     = 10,
                                            sortBy    = 'createdAt',
                                            sortOrder = 'DESC',
                                            viewMode  = 'list',
                                            user,
                                          }) => {
  const context = `${CONTEXT}/fetchPaginatedUsersService`;
  
  try {
    // 1. Resolve visibility access control scope for this user.
    const access = await evaluateUserVisibilityAccessControl(user);
    
    // 2. Apply visibility rules to filters (CRITICAL — must run before query).
    const adjustedFilters = applyUserListVisibilityRules(filters, access);
    
    // 3. Query raw paginated rows.
    const rawResult = await getPaginatedUsers({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // 4. Return empty shape immediately — no records to process.
    if (!rawResult || rawResult.data.length === 0) {
      return {
        data:       [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    // 5. Apply per-row visibility slicing based on resolved access scope.
    const visibleRows = rawResult.data
      .map((row) => sliceUserForUser(row, access))
      .filter(Boolean);
    
    // 6. Transform for UI consumption.
    const typedResult = /** @type {{ data: UserRow[], pagination: Object }} */ (
      { ...rawResult, data: visibleRows }
    );
    
    return transformPaginatedUserForViewResults(typedResult, viewMode);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to retrieve user records.', {
      context,
      meta: { error: error.message },
    });
  }
};

/**
 * Fetches a single user profile with permission-filtered fields.
 *
 * Evaluates profile-level and role-level visibility separately.
 * Returns only the fields the requester is authorised to see.
 *
 * @param {string} userId     - UUID of the user to retrieve.
 * @param {Object} requester  - Authenticated user making the request.
 *
 * @returns {Promise<Object>} Permission-filtered user profile DTO.
 *
 * @throws {AppError} `notFoundError`      – user does not exist or is inactive.
 * @throws {AppError} `authorizationError` – requester is not authorised to view this profile.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchUserProfileService = async (userId, requester) => {
  const context = `${CONTEXT}/fetchUserProfileService`;
  
  try {
    const activeId = getStatusId('general_active');
    
    // 1. Fetch base profile — active users only.
    const userRow = await getUserProfileById(userId, activeId);
    
    if (!userRow) {
      throw AppError.notFoundError(`User not found: ${userId}`);
    }
    
    // 2. Evaluate profile-level visibility — blocks entire profile if denied.
    const profileAccess   = await evaluateUserProfileAccessControl(requester, userId);
    const safeProfileRow  = sliceUserProfileForUser(userRow, profileAccess);
    
    if (!safeProfileRow) {
      throw AppError.authorizationError(
        'You are not authorized to view this user profile.'
      );
    }
    
    // 3. Evaluate role visibility — self or explicit permission.
    const roleAccess = await evaluateUserRoleViewAccessControl(requester, profileAccess);
    const withRole   = sliceUserRoleForUser(safeProfileRow, roleAccess);
    
    // 4. Transform to API DTO — avatar visibility is intentionally public.
    return transformUserProfileRow(withRole);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch user profile.', {
      context,
      meta: { error: error.message },
    });
  }
};

module.exports = {
  createUserService,
  fetchPaginatedUsersService,
  fetchUserProfileService,
};
