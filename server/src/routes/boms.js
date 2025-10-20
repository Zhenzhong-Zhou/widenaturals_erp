const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { bomQuerySchema } = require('../validators/bom-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const { fetchPaginatedBomsController } = require('../controllers/bom-controller');

const router = express.Router();

/**
 * Route: GET /api/v1/boms
 *
 * Fetches a paginated list of Bill of Materials (BOM) records.
 *
 * Middleware Stack:
 * - `authorize`: Requires `PERMISSIONS.BOMS.VIEW_LIST` permission.
 * - `createQueryNormalizationMiddleware`: Applies query normalization and sort-field mapping using `bomSortMap`.
 * - `sanitizeFields`: Trims and sanitizes text-based query fields (e.g. keyword, productName, skuCode).
 * - `validate`:
 *    - Validates query parameters using `bomQuerySchema`.
 * - `fetchPaginatedBomsController`:
 *    - Delegates to the service layer (`fetchPaginatedBomsService`).
 *    - Fetches paginated BOMs with flexible filters, sorting, and keyword search.
 *    - Returns standardized JSON with `data` and `pagination` keys.
 *
 * Supported Query Parameters:
 * - Pagination:
 *    - `page` (number) – default: 1
 *    - `limit` (number) – default: 10
 * - Sorting:
 *    - `sortBy` (string) – e.g. `productName`, `skuCode`, `revision`, `createdAt`
 *    - `sortOrder` (string) – `ASC` or `DESC` (default: `DESC`)
 * - Filters:
 *    - `productId`, `skuId` (UUID or UUID[])
 *    - `productName`, `skuCode` (string, partial match)
 *    - `statusId` (UUID)
 *    - `isActive`, `isDefault` (boolean)
 *    - `revisionMin`, `revisionMax` (integer)
 *    - `createdAfter`, `createdBefore` (ISO date)
 *    - `keyword` (string) – matches `b.name`, `b.code`, or `b.description`
 *
 * Example Request:
 *   GET /api/v1/boms?page=1&limit=20&isActive=true&sortBy=createdAt&sortOrder=DESC&keyword=Focus
 *
 * Success Response:
 * - `200 OK` with JSON payload:
 *   {
 *     "message": "Fetched BOM list successfully.",
 *     "data": [ { ...bomRecord } ],
 *     "pagination": { "page": 1, "limit": 20, "totalRecords": 100, "totalPages": 5 }
 *   }
 *
 * Error Handling:
 * - All exceptions are caught by the global error middleware.
 */
router.get(
  '/',
  authorize([PERMISSIONS.BOMS.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'bomSortMap',
    ['productId'],
    ['onlyActiveCompliance', 'isActive', 'isDefault'],
    bomQuerySchema
  ),
  sanitizeFields(['keyword', 'productName', 'skuCode']),
  validate(bomQuerySchema, 'query'),
  fetchPaginatedBomsController
);

module.exports = router;
