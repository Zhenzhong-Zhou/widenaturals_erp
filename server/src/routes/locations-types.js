const express = require('express');
const { authorize } = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const {
  locationTypeQuerySchema,
  locationTypeIdParamSchema,
} = require('../validators/location-type-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  getPaginatedLocationTypesController,
  getLocationTypeDetailsController,
} = require('../controllers/location-type-controller');

const router = express.Router();

/**
 * Route: GET /api/v1/location-types
 *
 * Retrieves a paginated, filterable, and sortable list
 * of location type configuration records.
 *
 * ---
 *
 * ### Middleware Pipeline
 *
 * 1. **authorize([PERMISSIONS.LOCATION_TYPES.VIEW])**
 *    - Ensures the requesting user has permission to view location type records.
 *
 * 2. **createQueryNormalizationMiddleware('locationTypeSortMap', ['statusIds'])**
 *    - Normalizes pagination, sorting, and filtering parameters.
 *    - Maps `sortBy` safely using `locationTypeSortMap`.
 *    - Converts array-based filters into consistent `string[]` format.
 *      Supported formats:
 *         - `?statusIds=uuid1,uuid2`
 *         - `?statusIds[]=uuid1&statusIds[]=uuid2`
 *         - `?statusIds=uuid1&statusIds=uuid2`
 *
 * 3. **sanitizeFields(['keyword', 'code', 'name'])**
 *    - Sanitizes text-based filters to prevent XSS injection.
 *
 * 4. **validate(locationTypeQuerySchema, 'query')**
 *    - Validates query parameters using Joi schema.
 *
 * 5. **getPaginatedLocationTypesController**
 *    - Delegates to service layer for business logic and transformation.
 *
 * ---
 *
 * ### Query Parameters
 *
 * | Name | Type | Default | Description |
 * |------|------|----------|--------------|
 * | `page` | number | 1 | Current page number |
 * | `limit` | number | 10 | Number of results per page |
 * | `sortBy` | string | `'createdAt'` | Sort field (validated via `locationTypeSortMap`) |
 * | `sortOrder` | `'ASC' \| 'DESC'` | `'DESC'` | Sort direction |
 * | `keyword` | string | — | Fuzzy search across code and name |
 * | `code` | string | — | Partial code match |
 * | `name` | string | — | Partial name match |
 * | `statusIds[]` | string[] (UUID) | — | Filter by one or more status IDs |
 * | `createdBy` / `updatedBy` | string (UUID) | — | Filter by audit user |
 *
 * ---
 *
 * ### Response
 *
 * ```json
 * {
 *   "success": true,
 *   "message": "Location types fetched successfully.",
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "code": "WAREHOUSE",
 *       "name": "Warehouse",
 *       "description": "Physical storage facility",
 *       "status": {
 *         "id": "uuid",
 *         "name": "Active",
 *         "date": "2025-11-03T20:20:00.000Z"
 *       },
 *       "audit": {
 *         "createdAt": "2025-11-03T20:20:00.000Z",
 *         "createdBy": {
 *           "firstname": "Root",
 *           "lastname": "Admin"
 *         },
 *         "updatedAt": "2025-11-03T21:00:00.000Z",
 *         "updatedBy": {
 *           "firstname": "Jane",
 *           "lastname": "Doe"
 *         }
 *       }
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "totalRecords": 5,
 *     "totalPages": 1
 *   }
 * }
 * ```
 *
 * ---
 *
 * ### Permissions
 * - Requires: `PERMISSIONS.LOCATION_TYPES.VIEW`
 *
 * ---
 *
 * ### Error Responses
 * - `403 Forbidden` → Missing permission
 * - `400 Bad Request` → Invalid query parameters
 * - `500 Internal Server Error` → Unexpected failure
 */
router.get(
  '/',
  authorize([PERMISSIONS.LOCATION_TYPES.VIEW]),
  createQueryNormalizationMiddleware(
    'locationTypeSortMap',
    ['statusIds'], // array filters
    [],
    locationTypeQuerySchema
  ),
  sanitizeFields(['keyword']),
  validate(locationTypeQuerySchema, 'query'),
  getPaginatedLocationTypesController
);

/**
 * Route: GET /api/v1/location-types/:locationTypeId/details
 *
 * Retrieves full location type details, including status and audit information.
 *
 * ### Middleware Pipeline
 * 1. **authorize([PERMISSIONS.LOCATION_TYPES.VIEW])**
 *    - Ensures the requesting user has permission to view location type records.
 * 2. **validate(locationTypeIdParamSchema, 'params')**
 *    - Validates the `locationTypeId` route parameter as a required UUID.
 * 3. **getLocationTypeDetailsController**
 *    - Delegates to the service layer to fetch and transform the location type record.
 *    - Returns a standardized JSON response with the full location type detail object.
 *
 * ### Path Parameters
 * | Name | Type | Description |
 * |------|------|--------------|
 * | `locationTypeId` | string (UUID) | Unique identifier of the location type to retrieve |
 *
 * ### Example Request
 * ```http
 * GET /api/v1/location-types/8d5b7e4f-9231-4b0f-83d1-6c8e3b03b8f2/details HTTP/1.1
 * Authorization: Bearer <token>
 * ```
 *
 * ### Example Response
 * ```json
 * {
 *   "success": true,
 *   "message": "Location type details fetched successfully.",
 *   "data": {
 *     "id": "8d5b7e4f-9231-4b0f-83d1-6c8e3b03b8f2",
 *     "code": "WAREHOUSE",
 *     "name": "Warehouse",
 *     "description": "Physical storage location",
 *     "status": {
 *       "id": "uuid",
 *       "name": "Active",
 *       "date": "2026-02-14T20:00:00.000Z"
 *     },
 *     "audit": {
 *       "createdAt": "2026-01-01T10:18:00.000Z",
 *       "createdBy": { "id": "uuid", "fullName": "Root Admin" },
 *       "updatedAt": "2026-02-01T21:00:00.000Z",
 *       "updatedBy": { "id": "uuid", "fullName": "Jane Doe" }
 *     }
 *   }
 * }
 * ```
 *
 * ### Permissions
 * - Requires: `PERMISSIONS.LOCATION_TYPES.VIEW_DETAILS`
 *
 * ### Errors
 * - `400 Bad Request` → Invalid or missing locationTypeId
 * - `403 Forbidden` → User lacks permission to view location types
 * - `404 Not Found` → Location type does not exist
 * - `500 Internal Server Error` → Unexpected database or service error
 */
router.get(
  '/:locationTypeId/details',
  authorize([PERMISSIONS.LOCATION_TYPES.VIEW_DETAILS]),
  validate(locationTypeIdParamSchema, 'params'),
  getLocationTypeDetailsController
);

module.exports = router;
