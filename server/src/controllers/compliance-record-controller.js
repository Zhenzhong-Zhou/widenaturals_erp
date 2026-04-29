/**
 * @file compliance-record-controller.js
 * @module controllers/compliance-record-controller
 *
 * @description
 * Controllers for the Compliance Record resource.
 *
 * Routes:
 *   GET /api/v1/compliance-records  → getPaginatedComplianceRecordsController
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
  fetchPaginatedComplianceRecordsService,
} = require('../services/compliance-record-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/compliance-records
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated compliance records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_COMPLIANCE_RECORDS permission.
 */
const getPaginatedComplianceRecordsController = wrapAsyncHandler(
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

    const { data, pagination } = await fetchPaginatedComplianceRecordsService({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: 'Compliance records retrieved successfully.',
      data,
      pagination,
      traceId: req.traceId,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedComplianceRecordsController,
};
