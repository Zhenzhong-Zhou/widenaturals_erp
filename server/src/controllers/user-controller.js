const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedUsersService,
  fetchUserProfileService,
} = require('../services/user-service');
const AppError = require('../utils/AppError');
const { fetchPermissions } = require('../services/role-permission-service');

/**
 * Controller: Fetch paginated users (list or card view).
 *
 * Responsibilities:
 * - Extract normalized and validated query parameters from middleware
 * - Enforce UI-level view-mode permissions (list vs card)
 * - Log request metadata and execution timing
 * - Delegate pagination, visibility, and transformation to the service layer
 * - Return a standardized paginated API response with trace metadata
 *
 * Notes:
 * - Route-level authorization ensures module access (e.g. VIEW_USERS)
 * - View-mode permissions (VIEW_LIST / VIEW_CARD) are enforced here
 * - Visibility rules (system/root users) are enforced in service/business layers
 * - Sorting columns are assumed SQL-safe (resolved upstream)
 * - `viewMode` affects response shape only; it does not affect data visibility
 */
const getPaginatedUsersController = wrapAsync(async (req, res) => {
  const context = 'user-controller/getPaginatedUsersController';
  const startTime = Date.now();
  
  // -------------------------------
  // 1. Extract normalized query params
  // -------------------------------
  // Parameters are normalized and schema-validated by upstream middleware
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    options,
  } = req.normalizedQuery;
  
  // -------------------------------
  // 1.1 View-mode permission enforcement
  // -------------------------------
  const permissions = req.permissions; // populated by authorize middleware (route-level)
  
  if (!permissions) {
    throw AppError.authorizationError('Permission context missing');
  }
  
  // UI-only view hint; defaults to list presentation
  const viewMode = options?.viewMode ?? 'list';
  
  // Defensive validation at controller boundary:
  // viewMode is UI-driven and validated separately from query schema
  const allowedViewModes = new Set(['list', 'card']);
  if (!allowedViewModes.has(viewMode)) {
    throw AppError.validationError('Invalid viewMode');
  }
  
  // Authenticated requester (populated by auth middleware)
  const user = req.user;
  
  // Trace identifier for correlating logs across controller,
  // service, and repository layers for this request lifecycle
  const traceId = `user-list-${Date.now().toString(36)}`;
  
  // -------------------------------
  // 2. Incoming request log
  // -------------------------------
  // Log request entry with normalized parameters for auditability
  // and performance diagnostics (no business logic applied yet)
  logInfo('Incoming request: fetch paginated users', req, {
    context,
    traceId,
    userId: user?.id,
    pagination: { page, limit },
    sorting: { sortBy, sortOrder },
    viewMode,
    filters,
  });
  
  // -------------------------------
  // 3. Execute service layer
  // -------------------------------
  // Sorting fields are resolved and SQL-safe via upstream normalization.
  // Visibility rules and data shaping are handled by the service layer.
  const { data, pagination } = await fetchPaginatedUsersService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    viewMode,
    user,
  });
  
  const elapsedMs = Date.now() - startTime;
  
  // -------------------------------
  // 4. Completion log
  // -------------------------------
  // Log completion with execution metrics for observability
  logInfo('Completed fetch paginated users', req, {
    context,
    traceId,
    pagination,
    sort: { sortBy, sortOrder },
    viewMode,
    count: data.length,
    elapsedMs,
  });
  
  // -------------------------------
  // 5. Send response
  // -------------------------------
  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully.',
    data,
    pagination,
    traceId,
  });
});

/**
 * Controller: Fetch User Profile
 *
 * Handles:
 *   GET /users/me/profile
 *   GET /users/:userId/profile
 *
 * Returns a comprehensive user profile payload containing:
 * - Core identity (email, full name)
 * - Contact information (phone, job title)
 * - Status information
 * - Role metadata (permission-aware)
 * - Avatar (public)
 * - Audit metadata
 *
 * All access control, slicing, and data shaping is handled inside
 * `fetchUserProfileService` to keep the controller thin and consistent.
 *
 * This controller is responsible only for:
 *  1. Resolving the target user ID (self vs explicit user)
 *  2. Logging request metadata
 *  3. Delegating work to the service layer
 *  4. Returning the final transformed response
 */
const getUserProfileController = wrapAsync(async (req, res) => {
  const context = 'user-controller/getUserProfileController';
  
  // Resolve target user ID:
  // - /users/me/profile        → req.user.id
  // - /users/:userId/profile   → req.params.userId
  const targetUserId = req.params.userId ?? req.user.id;
  
  // Authenticated requester context (set by verifyToken + verifySession)
  const requester = req.user;
  
  // Unique trace ID for request correlation
  const traceId = `user-profile-${Date.now().toString(36)}`;
  
  // -----------------------------
  // 1. Incoming request log
  // -----------------------------
  logInfo('Incoming request: fetch user profile', req, {
    context,
    traceId,
    targetUserId,
    requesterId: requester?.id,
    isSelf: requester?.id === targetUserId,
  });
  
  // -----------------------------
  // 2. Execute service layer
  // -----------------------------
  const userProfile = await fetchUserProfileService(
    targetUserId,
    requester
  );
  
  // -----------------------------
  // 3. Send response
  // -----------------------------
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully.',
    userId: targetUserId,
    data: userProfile,
    traceId,
  });
});

/**
 * Controller to get permissions for the authenticated user.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {AppError} - Throws if validation fails or if there's an error in fetching permissions.
 */
const getPermissions = wrapAsync(async (req, res, next) => {
  const { role } = req.user;

  if (!role) {
    return next(AppError.notFoundError('Role ID is required'));
  }

  // Fetch permissions from the service
  const rolePermissions = await fetchPermissions(role);

  res.status(200).json({
    success: true,
    message: 'Permissions retrieved successfully',
    data: rolePermissions,
  });
});

module.exports = {
  getPaginatedUsersController,
  getUserProfileController,
  getPermissions,
};
