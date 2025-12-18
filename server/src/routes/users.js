/**
 * @file users.js
 * @description Routes related to user operations.
 */

const express = require('express');
const authorize = require('../middlewares/authorize');
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
 * and UI presentation control.
 *
 * Responsibilities by layer:
 * - **Route**:
 *   - Enforces access control (`USERS.VIEW_LIST`)
 *   - Normalizes query parameters (pagination, sorting, filters, viewMode)
 *   - Sanitizes free-text inputs
 *   - Validates query shape and types (schema-level only)
 *
 * - **Controller / Service**:
 *   - Applies visibility rules (system / root / status)
 *   - Executes paginated queries
 *   - Shapes response data for list or card views
 *
 * Query behavior:
 * - `statusIds`, `roleIds` → normalized as UUID arrays
 * - Pagination & sorting → normalized and SQL-safe
 * - `viewMode` → UI-only option (`list` | `card`)
 *   - Forwarded to the controller unchanged for response shaping
 *   - Does NOT affect filtering or visibility
 * - Visibility constraints are enforced in the service layer
 *
 * This route does NOT:
 * - Perform business logic
 * - Enforce visibility rules
 * - Shape response data
 */
router.get(
  '/',
  authorize([PERMISSIONS.USERS.VIEW_LIST]),
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
