/**
 * @fileoverview
 * Controller module for all Bill of Materials (BOM)-related API endpoints.
 *
 * This module handles HTTP request processing, validation, and response formatting
 * for BOM operations, delegating business logic and data access to the service and
 * repository layers. It ensures consistent response shapes, logging, and error handling
 * across all BOM endpoints.
 *
 * Responsibilities include (but are not limited to):
 * - Fetching paginated BOM lists with filtering and sorting
 * - Retrieving detailed BOM compositions by SKU
 * - Creating, updating, or versioning BOMs
 * - Managing active/default BOM states
 * - Handling audit metadata (created_by, updated_by)
 *
 * All controller functions follow a consistent structure:
 *  1. Validate and normalize request parameters.
 *  2. Delegate data and business logic to the service layer.
 *  3. Return standardized JSON responses via `AppResponse`.
 *  4. Log both success and failure contexts for observability.
 *
 * Example route structure:
 *   GET    /api/v1/boms                     → fetchPaginatedBomsController
 *   GET    /api/v1/boms/:bomId              → fetchBomByIdController
 *   GET    /api/v1/skus/:skuId/bom          → fetchSkuBomCompositionController
 *   POST   /api/v1/boms                     → createBomController
 *   PATCH  /api/v1/boms/:bomId              → updateBomController
 *   DELETE /api/v1/boms/:bomId/archive      → archiveBomController
 *
 * @module controllers/bom-controller
 * @see services/bom-service
 * @see repositories/bom-repository
 * @see utils/AppResponse
 * @see utils/system-logger
 */

const {
  fetchPaginatedBomsService,
  fetchBomDetailsService,
  fetchBOMProductionSummaryService
} = require('../services/bom-service');
const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');

/**
 * @function
 * @description
 * Handles HTTP GET requests for fetching a paginated, filterable, and sortable list
 * of Bill of Materials (BOM) records.
 *
 * This controller serves as the presentation-layer entry point for the BOM list API
 * (e.g., `GET /api/v1/boms`). It delegates data retrieval to
 * {@link fetchPaginatedBomsService}, which performs repository queries and transformations.
 *
 * Note:
 * This controller assumes that incoming query parameters have already been normalized
 * by middleware (e.g., `createQueryNormalizationMiddleware`), ensuring consistent handling
 * of pagination, filters, and sorting before reaching this layer.
 *
 * @async
 * @param {import('express').Request} req - Express request object containing normalized query params.
 * @param {import('express').Response} res - Express response object used to send JSON results.
 * @param {import('express').NextFunction} next - Express next middleware function for error handling.
 *
 * @returns {Promise<void>} Sends a standardized JSON response containing:
 * - `data`: an array of structured BOM records
 * - `pagination`: metadata including page, limit, totalRecords, totalPages
 *
 * @example
 * // Example request:
 * // GET /api/v1/boms?page=2&limit=20&sortBy=p.name&sortOrder=ASC&keyword=Capsule
 *
 * // Example route definition:
 * router.get(
 *   '/',
 *   authorize([PERMISSIONS.BOMS.VIEW_LIST]),
 *   createQueryNormalizationMiddleware('bomSortMap'),
 *   fetchPaginatedBomsController
 * );
 *
 * // Example JSON response:
 * {
 *   "success": true,
 *   "message": "Fetched BOM list successfully.",
 *   "data": [ { "product": {...}, "sku": {...}, "bom": {...} }, ... ],
 *   "pagination": { "page": 2, "limit": 20, "totalRecords": 52, "totalPages": 3 }
 * }
 *
 * @see fetchPaginatedBomsService
 * @see AppError
 * @see wrapAsync
 */
const getPaginatedBomsController = wrapAsync(async (req, res) => {
  // Extract normalized query parameters
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  // Step 1: Delegate to service
  const { data, pagination } = await fetchPaginatedBomsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  // Step 2: Structured logging
  logInfo('Fetched paginated BOM list request', req, {
    context: 'bom-controller/fetchPaginatedBomsController',
    filters,
    pagination,
    sorting: { sortBy, sortOrder },
    count: pagination.totalRecords,
  });
  
  // Step 3: Send standardized success response
  res.status(200).json({
    success: true,
    message: 'Fetched BOM list successfully.',
    data,
    pagination,
  });
});

/**
 * Controller: Fetch full BOM details and cost summary by BOM ID.
 *
 * Route: GET /api/v1/boms/:bomId/details
 *
 * Responsibilities:
 *  - Validate BOM ID (middleware or Joi schema)
 *  - Call service layer to fetch structured BOM details
 *  - Return standardized JSON response with optional summary
 *  - Handle and log success/failure consistently
 *
 * @async
 * @function
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware
 * @returns {Promise<void>} Sends standardized JSON response.
 *
 * @example
 * // Request
 * GET /api/v1/boms/b8a81f8f-45b1-4c4a-9a2b-ef8e2a123456/details
 *
 * // Response
 * {
 *   "success": true,
 *   "message": "Fetched BOM details successfully.",
 *   "data": {
 *     "header": { ... },
 *     "details": [ ... ],
 *     "summary": { ... }
 *   }
 * }
 */
const getBomDetailsController = wrapAsync(async (req, res) => {
  const { bomId } = req.params;
  
  // Step 1: Call service to fetch detailed BOM structure
  const result = await fetchBomDetailsService(bomId);
  
  // Step 2: Log success for traceability
  logInfo('Fetched BOM details successfully', req, {
    context: 'bom-controller/getBomDetailsController',
    bomId,
    itemCount: result?.details?.length || 0,
    totalEstimatedCost: result?.summary?.totalEstimatedCost || 0,
  });
  
  // Step 3: Return standardized API response
  res.status(200).json({
    success: true,
    message: 'Fetched BOM details successfully.',
    data: result,
  });
});

/**
 * GET /api/v1/boms/:bomId/production-summary
 *
 * Fetches a detailed production readiness report for the specified BOM.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 *
 * @returns {Promise<void>} Sends JSON response with structured readiness data
 *
 * @example
 * // Request:
 * GET /api/boms/61bb1f94-aeb2-4724-b9b8-35023b165fdd/production-summary
 *
 * // Response:
 * {
 *   "bomId": "61bb1f94-aeb2-4724-b9b8-35023b165fdd",
 *   "metadata": {
 *     "maxProducibleUnits": 40,
 *     "isReadyForProduction": true,
 *     "stockHealth": { "usable": 12175, "inactive": 0 },
 *     "bottleneckParts": [{ "partId": "...", "partName": "Capsule" }],
 *     "generatedAt": "2025-10-24T17:57:26.988Z"
 *   },
 *   "parts": [
 *     {
 *       "partId": "...",
 *       "partName": "Capsule",
 *       "requiredQtyPerUnit": 60,
 *       "totalAvailableQuantity": 2450,
 *       "maxProducibleUnits": 40,
 *       "isBottleneck": true,
 *       "materials": [ { "materialName": "...", "availableQuantity": 2450 } ]
 *     }
 *   ]
 * }
 */
const fetchBOMProductionSummaryController = wrapAsync(async (req, res) => {
  const { bomId } = req.params;
  
  logInfo('Fetching BOM production readiness', req, {
    context: 'bom-controller/fetchBOMProductionSummaryController',
    bomId,
  });
  
  // 1 Call service
  const result = await fetchBOMProductionSummaryService(bomId);
  
  // 2 Log and respond
  logInfo('BOM production readiness retrieved successfully', req, {
    context: 'bom-controller/fetchBOMProductionSummaryController',
    bomId,
    maxProducibleUnits: result?.metadata?.maxProducibleUnits ?? null,
  });
  
  // 3 Respond
  res.status(200).json({
    success: true,
    message: 'BOM production readiness summary retrieved successfully.',
    data: result,
  });
});

module.exports = {
  getPaginatedBomsController,
  getBomDetailsController,
  fetchBOMProductionSummaryController,
};
