/**
 * @file location-type-controller.js
 * @module controllers/location-type-controller
 *
 * @description
 * Controllers for the Location Type resource.
 *
 * Routes:
 *   GET /api/v1/location-types          → getPaginatedLocationTypesController
 *   GET /api/v1/location-types/:locationTypeId → getLocationTypeDetailsController
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
  fetchPaginatedLocationTypesService,
  fetchLocationTypeDetailsService,
} = require('../services/location-type-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/location-types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated location type records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_LOCATION_TYPES permission.
 */
const getPaginatedLocationTypesController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedLocationTypesService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Location types retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/location-types/:locationTypeId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves details for a specific location type.
 *
 * locationTypeId presence is guaranteed by Express routing.
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, VIEW_LOCATION_TYPES permission.
 */
const getLocationTypeDetailsController = wrapAsyncHandler(async (req, res) => {
  const { locationTypeId } = req.params;
  
  const data = await fetchLocationTypeDetailsService(locationTypeId);
  
  res.status(200).json({
    success: true,
    message: 'Location type details retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedLocationTypesController,
  getLocationTypeDetailsController,
};
