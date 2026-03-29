/**
 * @file location-controller.js
 * @module controllers/location-controller
 *
 * @description
 * Controllers for the Location resource.
 *
 * Routes:
 *   GET /api/v1/locations  → getPaginatedLocationsController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId, pagination,
 *   sorting, filters) are emitted automatically by the global request-logger
 *   middleware via res.on('finish'). No controller-level logging needed.
 *
 * Empty results:
 *   An empty result set is a valid 200 response — the service returns
 *   { data: [], pagination } naturally. No special branch is needed here.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedLocationsService,
} = require('../services/location-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/locations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated location records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_LOCATIONS permission.
 */
const getPaginatedLocationsController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedLocationsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Locations retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedLocationsController,
};
