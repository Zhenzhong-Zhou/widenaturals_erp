const express = require('express');
const { authorize } = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { locationQuerySchema } = require('../validators/location-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  getPaginatedLocationsController,
} = require('../controllers/location-controller');

const router = express.Router();

/**
 * Route: GET /api/v1/locations
 *
 * Retrieves a paginated, filterable, and sortable list of locations.
 *
 * ---
 *
 * ### Middleware Pipeline
 *
 * 1. **authorize([PERMISSIONS.LOCATIONS.VIEW])**
 *    - Ensures the requesting user has permission to view location records.
 *
 * 2. **createQueryNormalizationMiddleware('locationSortMap', ['statusIds', 'locationTypeIds'])**
 *    - Normalizes pagination, sorting, and filtering parameters.
 *    - Maps `sortBy` safely using `locationSortMap` → SQL column aliases.
 *    - Converts array-based filters into consistent `string[]` format.
 *      Supported formats:
 *         - `?statusIds=uuid1,uuid2`
 *         - `?statusIds[]=uuid1&statusIds[]=uuid2`
 *         - `?statusIds=uuid1&statusIds=uuid2`
 *
 * 3. **sanitizeFields(['keyword', 'city', 'province_or_state', 'country'])**
 *    - Sanitizes text-based filters to prevent XSS injection.
 *
 * 4. **validate(locationQuerySchema, 'query')**
 *    - Validates query parameters using Joi schema.
 *
 * 5. **getPaginatedLocationsController**
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
 * | `sortBy` | string | `'createdAt'` | Sort field (validated via `locationSortMap`) |
 * | `sortOrder` | `'ASC' \| 'DESC'` | `'DESC'` | Sort direction |
 * | `keyword` | string | — | Fuzzy search on location name |
 * | `city` | string | — | Filter by city |
 * | `province_or_state` | string | — | Filter by province/state |
 * | `country` | string | — | Filter by country |
 * | `locationTypeIds[]` | string[] (UUID) | — | Filter by one or more location type IDs |
 * | `statusIds[]` | string[] (UUID) | — | Filter by one or more status IDs |
 * | `isArchived` | boolean | — | Filter archived vs active |
 * | `createdBy` / `updatedBy` | string (UUID) | — | Filter by audit user |
 *
 * ---
 *
 * ### Response
 *
 * ```json
 * {
 *   "success": true,
 *   "message": "Locations fetched successfully.",
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "Main Warehouse",
 *       "locationType": {
 *         "name": "Warehouse"
 *       },
 *       "city": "Vancouver",
 *       "province": "BC",
 *       "country": "Canada",
 *       "isArchived": false,
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
 *     "totalRecords": 24,
 *     "totalPages": 3
 *   }
 * }
 * ```
 *
 * ---
 *
 * ### Permissions
 * - Requires: `PERMISSIONS.LOCATIONS.VIEW`
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
  authorize([PERMISSIONS.LOCATIONS.VIEW]),
  createQueryNormalizationMiddleware(
    'locationSortMap',
    ['statusIds', 'locationTypeIds'], // array filters
    [],
    locationQuerySchema
  ),
  sanitizeFields(['keyword', 'city', 'province_or_state', 'country']),
  validate(locationQuerySchema, 'query'),
  getPaginatedLocationsController
);

module.exports = router;
