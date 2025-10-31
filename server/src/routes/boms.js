const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { bomQuerySchema, bomIdParamSchema } = require('../validators/bom-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  getPaginatedBomsController,
  getBomDetailsController, fetchBOMProductionSummaryController
} = require('../controllers/bom-controller');

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
  getPaginatedBomsController
);

/**
 * ---------------------------------------------------------------------
 * GET /api/v1/boms/:bomId/details
 * ---------------------------------------------------------------------
 * @summary Fetch full BOM details including composition and cost summary.
 * @description
 * Retrieves a complete Bill of Materials (BOM) by its ID.
 * Includes:
 *   - Product & SKU metadata
 *   - Compliance information (if applicable)
 *   - BOM header (revision, status, audit info)
 *   - BOM items (parts, quantities, specifications, estimated unit costs)
 *   - Optional summary section with total estimated cost (aggregated from items)
 *
 * Notes:
 * - Only accessible to users with BOM view permissions.
 * - Estimated cost data is derived from static `estimated_unit_cost` fields;
 *   it does **not** include real-time supplier batch or procurement costs.
 *
 * @route GET /api/v1/boms/:bomId/details
 * @access Protected
 *
 * @param {string} bomId.path.required - BOM UUID (validated via Joi)
 * @returns {200} Structured BOM details `{ header, details, summary }`
 * @returns {400} Invalid BOM ID format
 * @returns {404} BOM not found
 * @returns {403} User not authorized
 *
 * @example
 * // Request
 * GET /api/v1/boms/b8a81f8f-45b1-4c4a-9a2b-ef8e2a123456/details
 *
 * // Response
 * {
 *   "header": {
 *     "product": { "name": "Triple Complex Minerals" },
 *     "sku": { "code": "PG-TCM300-R-CN" },
 *     "bom": { "revision": 2, "status": { "name": "Active" } }
 *   },
 *   "details": [
 *     {
 *       "part": { "name": "Bottle", "type": "Packaging" },
 *       "quantityPerUnit": 1,
 *       "estimatedUnitCost": 1.25
 *     },
 *     {
 *       "part": { "name": "Label" },
 *       "quantityPerUnit": 1,
 *       "estimatedUnitCost": 0.75
 *     }
 *   ],
 *   "summary": {
 *     "type": "ESTIMATED",
 *     "totalEstimatedCost": 2.00,
 *     "currency": "CAD"
 *   }
 * }
 */
router.get(
  '/:bomId/details',
  authorize([PERMISSIONS.BOMS.VIEW_BOM_DETAILS]),
  validate(bomIdParamSchema, 'params'), // Joi param validator for BOM ID
  getBomDetailsController                // Controller
);

/**
 * @route GET /api/v1/boms/:bomId/production-summary
 * @group BOMs - Bill of Materials
 * @permission VIEW_BOM_PRODUCTION_SUMMARY
 *
 * Retrieves a detailed **production readiness summary** for a specific Bill of Materials (BOM).
 *
 * The summary includes:
 *  - Required quantities per part (per finished unit)
 *  - Available material quantities across warehouses
 *  - Maximum manufacturable units (bottleneck-based)
 *  - Shortages, inactive batches, and stock health indicators
 *
 * Middlewares:
 *  - `authorize([PERMISSIONS.BOMS.VIEW_BOM_PRODUCTION_SUMMARY])`: Ensures the requester has
 *    permission to view BOM production readiness data.
 *  - `validate(bomIdParamSchema, 'params')`: Validates the `bomId` path parameter via Joi schema.
 *
 * @example
 * // Request
 * GET /api/boms/61bb1f94-aeb2-4724-b9b8-35023b165fdd/production-summary
 *
 * // Response (200)
 * {
 *   "success": true,
 *   "message": "BOM production readiness summary retrieved successfully.",
 *   "data": {
 *     "bomId": "61bb1f94-aeb2-4724-b9b8-35023b165fdd",
 *     "metadata": {
 *       "maxProducibleUnits": 40,
 *       "isReadyForProduction": true,
 *       "stockHealth": { "usable": 12175, "inactive": 0 },
 *       "bottleneckParts": [{ "partId": "...", "partName": "Capsule" }],
 *       "generatedAt": "2025-10-24T17:57:26.988Z"
 *     },
 *     "parts": [
 *       {
 *         "partId": "...",
 *         "partName": "Capsule",
 *         "requiredQtyPerUnit": 60,
 *         "totalAvailableQuantity": 2450,
 *         "maxProducibleUnits": 40,
 *         "isBottleneck": true,
 *         "materials": [
 *           { "materialName": "Vegetable Capsule 0", "availableQuantity": 2450 }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * @returns {200} JSON Response containing structured production readiness data
 * @returns {403} Forbidden - Missing or insufficient permissions
 * @returns {400} Bad Request - Invalid BOM ID parameter
 * @returns {500} Internal Server Error - Unexpected server error
 */
router.get(
  '/:bomId/production-summary',
  authorize([PERMISSIONS.BOMS.VIEW_BOM_PRODUCTION_SUMMARY]),
  validate(bomIdParamSchema, 'params'),
  fetchBOMProductionSummaryController
);

module.exports = router;
