/**
 * @file user-controller.js
 * @module controllers/user-controller
 *
 * @description
 * Controllers for the User resource.
 *
 * Routes:
 *   POST /api/v1/users                        → createUserController
 *   GET  /api/v1/users                        → getPaginatedUsersController
 *   GET  /api/v1/users/:userId/profile        → getUserProfileController
 *   GET  /api/v1/users/me/profile             → getUserProfileController
 *   GET  /api/v1/users/permissions            → getUserPermissionsController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId, pagination,
 *   sorting, filters) are emitted automatically by the global request-logger
 *   middleware via res.on('finish'). No controller-level logging needed.
 *
 * Validation:
 *   All input validation (body shape, viewMode, role) is handled by Joi
 *   middleware upstream. Controllers never validate or coerce input.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  createUserService,
  fetchPaginatedUsersService,
  fetchUserProfileService,
} = require('../services/user-service');
const { fetchPermissions } = require('../services/role-permission-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new user account.
 *
 * Requires: auth middleware, Joi body validation, CREATE_USER permission.
 */
const createUserController = wrapAsyncHandler(async (req, res) => {
  const actor = req.auth.user;
  
  const result = await createUserService(req.body, actor);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated user records with optional filters, sorting, and view mode.
 *
 * viewMode ('list' | 'card') is validated upstream by Joi.
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_USERS permission.
 */
const getPaginatedUsersController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters, options } = req.normalizedQuery;
  const user     = req.auth.user;
  const viewMode = options?.viewMode ?? 'list';
  
  const { data, pagination } = await fetchPaginatedUsersService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    viewMode,
    user,
  });
  
  res.status(200).json({
    success:   true,
    message:   'Users retrieved successfully.',
    data,
    pagination,
    traceId:   req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/:userId/profile
// GET /api/v1/users/me/profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves the profile for a specific user or the authenticated user.
 *
 * /users/me/profile    → resolves to req.auth.user.id
 * /users/:userId/profile → resolves to req.params.userId
 *
 * Requires: auth middleware, VIEW_USER_PROFILE permission.
 */
const getUserProfileController = wrapAsyncHandler(async (req, res) => {
  const requester    = req.auth.user;
  const targetUserId = req.params.userId ?? requester.id;
  
  const data = await fetchUserProfileService(targetUserId, requester);
  
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/permissions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves permissions for the authenticated user's role.
 *
 * Requires: auth middleware, VIEW_PERMISSIONS permission.
 */
const getUserPermissionsController = wrapAsyncHandler(async (req, res) => {
  const { role } = req.auth.user;
  
  const data = await fetchPermissions(role);
  
  res.status(200).json({
    success: true,
    message: 'Permissions retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  createUserController,
  getPaginatedUsersController,
  getUserProfileController,
  getUserPermissionsController,
};
