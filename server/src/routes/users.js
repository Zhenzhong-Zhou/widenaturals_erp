/**
 * @file users.js
 * @description User creation, profile, permission, and paginated query routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`
 * or `authorizeAny`. Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express                            = require('express');
const { authorize, authorizeAny }        = require('../middlewares/authorize');
const { createUserProfileRateLimiter }   = require('../middlewares/rate-limiter');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSIONS                        = require('../utils/constants/domain/permissions');
const {
  userQuerySchema,
  userIdParamSchema,
  createUserSchema,
} = require('../validators/user-validators');
const {
  getUserPermissionsController,
  getPaginatedUsersController,
  getUserProfileController,
  createUserController,
} = require('../controllers/user-controller');

const router = express.Router();

/**
 * @route POST /users
 * @description Create a new user account. Rate-limited to prevent automated
 * account creation. Strict body validation — no unknown fields permitted.
 * @access protected
 * @permission USERS.CREATE_USER
 */
router.post(
  '/',
  authorize([PERMISSIONS.USERS.CREATE_USER]),
  createUserProfileRateLimiter(),
  validate(createUserSchema, 'body', {
    allowUnknown: false, // strict — no unknown fields permitted on user creation
  }),
  createUserController
);

/**
 * @route GET /users
 * @description Paginated user records with optional filters, sorting, and view mode.
 * Filters: statusIds, roleIds.
 * Sorting: sortBy, sortOrder (uses userSortMap).
 * @access protected
 * @permission USERS.VIEW_LIST or USERS.VIEW_CARD
 */
router.get(
  '/',
  authorizeAny([PERMISSIONS.USERS.VIEW_LIST, PERMISSIONS.USERS.VIEW_CARD]),
  validate(userQuerySchema, 'query', {
    allowUnknown: true, // downstream middleware normalizes unknown keys before business layer
  }),
  createQueryNormalizationMiddleware(
    'userSortMap',               // moduleKey — drives allowed sortBy fields
    ['statusIds', 'roleIds'],    // arrayKeys — normalized as UUID arrays
    [],                          // booleanKeys — none client-controlled
    userQuerySchema,             // filterKeysOrSchema — extracts filter keys from schema
    {},                          // options overrides — none
    [],                          // option-level booleans — none
    ['viewMode']                 // option-level strings — controls UI view shape
  ),
  getPaginatedUsersController
);

/**
 * @route GET /users/me/profile
 * @description Returns the authenticated user's own profile record.
 * @access protected
 * @permission USERS.VIEW_SELF_PROFILE
 */
router.get(
  '/me/profile',
  authorize([PERMISSIONS.USERS.VIEW_SELF_PROFILE]),
  getUserProfileController
);

/**
 * @route GET /users/:userId/profile
 * @description Returns the profile record for any user by ID.
 * @access protected
 * @permission USERS.VIEW_ANY_USER_PROFILE
 */
router.get(
  '/:userId/profile',
  authorize([PERMISSIONS.USERS.VIEW_ANY_USER_PROFILE]),
  validate(userIdParamSchema, 'params'),
  getUserProfileController
);

/**
 * @route GET /users/me/permissions
 * @description Returns the full permission set for the authenticated user.
 * No explicit authorize call — access is gated by the global authentication
 * middleware applied upstream. All authenticated users may fetch their own
 * permissions regardless of role.
 * @access protected
 */
router.get(
  '/me/permissions',
  getUserPermissionsController
);

module.exports = router;
