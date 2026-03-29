/**
 * @file report-controller.js
 * @module controllers/report-controller
 *
 * @description
 * Controllers for the Report resource.
 *
 * Routes:
 *   GET /api/v1/reports/inventory-activity  → getInventoryActivityLogsController
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
  fetchInventoryActivityLogsService,
} = require('../services/report-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/reports/inventory-activity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated inventory activity log records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_INVENTORY_ACTIVITY_LOGS permission.
 */
const getInventoryActivityLogsController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.auth.user;
  
  const { data, pagination } = await fetchInventoryActivityLogsService(
    user,
    { filters, page, limit, sortBy, sortOrder },
  );
  
  res.status(200).json({
    success:   true,
    message:   'Inventory activity logs retrieved successfully.',
    data,
    pagination,
    traceId:   req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getInventoryActivityLogsController,
};
