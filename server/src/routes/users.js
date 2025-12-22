/**
 * @file users.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { authorize, authorizeAny } = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { userQuerySchema } = require('../validators/user-validators');
const validate = require('../middlewares/validate');
const { sanitizeFields } = require('../middlewares/sanitize');
const {
  getUserProfile,
  getPermissions,
  getPaginatedUsersController,
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
  authorizeAny([
    PERMISSIONS.USERS.VIEW_LIST,
    PERMISSIONS.USERS.VIEW_CARD,
  ]),
  createQueryNormalizationMiddleware(
    'userSortMap',
    ['statusIds', 'roleIds'],       // array filters
    [],                           // boolean filters (none at filter level)
    userQuerySchema,                         // filter schema
    {},
    [],                      // option-level booleans
    ['viewMode']              // option-level strings (UI-only)
  ),
  sanitizeFields(['keyword']),
  validate(userQuerySchema, 'query', {
    allowUnknown: true
  }),
  getPaginatedUsersController
);

/**
 * @route GET /users/me
 * @description Fetch the authenticated user's profile.
 */
router.get('/me', createUserProfileRateLimiter(), getUserProfile);

router.get('/me/permissions', getPermissions);

module.exports = router;
