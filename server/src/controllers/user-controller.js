const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const {
  getUserProfileById, fetchPaginatedUsersService,
} = require('../services/user-service');
const AppError = require('../utils/AppError');
const { fetchPermissions } = require('../services/role-permission-service');

/**
 * Controller: Fetch paginated users (list or card view).
 *
 * Responsibilities:
 * - Extract normalized and validated query parameters from middleware
 * - Log request metadata and execution timing
 * - Delegate pagination, visibility, and transformation to the service layer
 * - Return a standardized paginated API response with trace metadata
 *
 * Notes:
 * - Visibility rules (system/root users) are enforced in service/business layers
 * - Sorting columns are assumed SQL-safe (resolved upstream)
 * - `viewMode` controls response shape only ('list' | 'card')
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
  
  // UI-only view hint; defaults to list presentation
  const viewMode = options?.viewMode ?? 'list';
  
  // Defensive validation at controller boundary:
  // `viewMode` is UI-driven and not part of the query schema,
  // but must be constrained to supported response shapes.
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
 * Controller to fetch the authenticated user's profile.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
const getUserProfile = wrapAsync(async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    throw AppError.authenticationError('User is not authenticated');
  }

  // Fetch user profile
  const userProfile = await getUserProfileById(req.user.id);

  // Send standardized response
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: userProfile,
    timestamp: new Date().toISOString(),
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
  getUserProfile,
  getPermissions,
};
