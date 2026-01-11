/**
 * @file users.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { authorize, authorizeAny } = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const {
  userQuerySchema,
  userIdParamSchema,
} = require('../validators/user-validators');
const validate = require('../middlewares/validate');
const { sanitizeFields } = require('../middlewares/sanitize');
const {
  getPermissions,
  getPaginatedUsersController,
  getUserProfileController,
} = require('../controllers/user-controller');
const { createUserProfileRateLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

/**
 * GET /users
 *
 * Fetch a paginated list of users with optional filtering, sorting,
 * and UI presentation control (list or card view).
 *
 * Responsibilities by layer:
 *
 * - **Route Middleware**:
 *   - Enforces module-level access control (`USERS.VIEW_USERS`)
 *   - Ensures the requester has permission for at least one supported view
 *     (`USERS.VIEW_LIST` or `USERS.VIEW_CARD`)
 *   - Normalizes query parameters (pagination, sorting, filters, options)
 *   - Sanitizes free-text inputs
 *   - Validates query shape and types (schema-level only)
 *
 * - **Controller**:
 *   - Enforces view-mode–specific permissions (`VIEW_LIST` vs `VIEW_CARD`)
 *   - Validates supported `viewMode` values
 *   - Coordinates logging, tracing, and request lifecycle
 *   - Delegates pagination, visibility, and data shaping to the service layer
 *
 * - **Service / Business Layer**:
 *   - Applies user visibility rules (system users, root users, status)
 *   - Executes paginated queries
 *   - Shapes response data according to the requested view mode
 *
 * Query behavior:
 * - `statusIds`, `roleIds`
 *   → normalized as UUID arrays
 * - Pagination & sorting
 *   → normalized and SQL-safe via upstream middleware
 * - `viewMode`
 *   → UI-only option (`list` | `card`)
 *     - Forwarded to the controller for authorization and response shaping
 *     - Does NOT affect filtering or visibility rules
 *
 * This route does NOT:
 * - Perform business logic
 * - Apply row-level visibility rules
 * - Shape response data directly
 */
router.get(
  '/',
  authorize([PERMISSIONS.USERS.VIEW_USERS]),
  authorizeAny([PERMISSIONS.USERS.VIEW_LIST, PERMISSIONS.USERS.VIEW_CARD]),
  createQueryNormalizationMiddleware(
    'userSortMap',
    ['statusIds', 'roleIds'], // array filters
    [], // boolean filters (none at filter level)
    userQuerySchema, // filter schema
    {},
    [], // option-level booleans
    ['viewMode'] // option-level strings (UI-only)
  ),
  sanitizeFields(['keyword']),
  validate(userQuerySchema, 'query', {
    allowUnknown: true,
  }),
  getPaginatedUsersController
);

/**
 * Route: GET /users/me/profile
 *
 * Retrieves the authenticated user's own profile.
 *
 * This endpoint:
 * - Always resolves to the requesting user
 * - Does NOT accept a userId parameter
 * - Does NOT allow viewing other users
 *
 * Middleware Chain:
 * 1. authorize([PERMISSIONS.USERS.VIEW_SELF_PROFILE])
 *      - Ensures the requester is allowed to view their own profile.
 *      - Granted to all authenticated user roles.
 *
 * 2. getUserProfileController
 *      - Resolves target user as req.user.id
 *      - Delegates visibility enforcement to the service layer
 *      - Returns a fully transformed UserProfileDTO
 *
 * Permissions:
 *   - Requires USERS.VIEW_SELF_PROFILE
 *
 * Errors:
 *   - 403 if requester lacks self-profile access (rare)
 *   - 500 for unexpected server errors
 */
router.get(
  '/me/profile',
  authorize([PERMISSIONS.USERS.VIEW_SELF_PROFILE]),
  getUserProfileController
);

/**
 * Route: GET /users/:userId/profile
 *
 * Retrieves a fully enriched user profile payload for a specific user.
 *
 * This endpoint is intended for privileged users (e.g. admin, HR, support)
 * who are allowed to view profiles other than their own.
 *
 * Returned payload may include:
 * - Core identity (email, full name)
 * - Contact information (phone number, job title)
 * - Status information
 * - Role metadata (permission-aware)
 * - Avatar (public)
 * - Audit metadata
 *
 * Middleware Chain:
 * 1. authorize([PERMISSIONS.USERS.VIEW_ANY_USER_PROFILE])
 *      - Ensures the requester has explicit permission to view
 *        other users’ profiles.
 *      - This is a privileged capability and is NOT granted
 *        to normal users.
 *
 * 2. validate(userIdParamSchema, 'params')
 *      - Ensures `userId` is a valid UUID.
 *      - Prevents unnecessary database queries and improves error clarity.
 *
 * 3. getUserProfileController
 *      - Delegates to fetchUserProfileService(), which:
 *          → enforces profile-level visibility (self vs non-self)
 *          → slices role metadata based on permissions
 *          → transforms output via transformUserProfileRow()
 *      - Returns a consistent API response envelope with traceId.
 *
 * Permissions:
 *   - Requires USERS.VIEW_ANY_USER_PROFILE
 *
 * Errors:
 *   - 400 if userId is invalid
 *   - 403 if requester lacks permission to view other users
 *   - 404 if user does not exist or is not accessible
 *   - 500 for unexpected server errors (captured by global error handler)
 */
router.get(
  '/:userId/profile',
  authorize([PERMISSIONS.USERS.VIEW_ANY_USER_PROFILE]),
  validate(userIdParamSchema, 'params'),
  getUserProfileController
);

router.get('/me/permissions', getPermissions);


// todo: create user

module.exports = router;
