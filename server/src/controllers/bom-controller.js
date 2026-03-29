/**
 * @file bom-controller.js
 * @module controllers/bom-controller
 *
 * @description
 * Controllers for the Bill of Materials (BOM) resource.
 *
 * Routes:
 *   GET /api/v1/boms                        → getPaginatedBomsController
 *   GET /api/v1/boms/:bomId                 → getBomDetailsController
 *   GET /api/v1/boms/:bomId/production-summary → getBomProductionSummaryController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId, pagination,
 *   sorting, filters) are emitted automatically by the global request-logger
 *   middleware via res.on('finish'). No controller-level logging needed.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedBomsService,
  fetchBomDetailsService,
  fetchBOMProductionSummaryService,
} = require('../services/bom-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/boms
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated BOM records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_BOMS permission.
 */
const getPaginatedBomsController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedBomsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'BOM list retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/boms/:bomId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves full structure and cost summary for a single BOM.
 *
 * Requires: auth middleware, VIEW_BOMS permission.
 */
const getBomDetailsController = wrapAsyncHandler(async (req, res) => {
  const { bomId } = req.params;
  
  const result = await fetchBomDetailsService(bomId);
  
  res.status(200).json({
    success: true,
    message: 'BOM details retrieved successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/boms/:bomId/production-summary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves production readiness summary for a BOM.
 *
 * Includes max producible units and material availability breakdown.
 * Requires: auth middleware, VIEW_BOMS permission.
 */
const getBomProductionSummaryController = wrapAsyncHandler(async (req, res) => {
  const { bomId } = req.params;
  
  const result = await fetchBOMProductionSummaryService(bomId);
  
  res.status(200).json({
    success: true,
    message: 'BOM production summary retrieved successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedBomsController,
  getBomDetailsController,
  getBomProductionSummaryController,
};
