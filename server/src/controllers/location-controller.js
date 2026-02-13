const wrapAsync = require('../utils/wrap-async');
const { fetchPaginatedLocationsService } = require('../services/location-service');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller: Fetch Paginated Locations
 *
 * Handles GET requests for `/api/locations` with optional filters,
 * sorting, and pagination.
 *
 * ------------------------------------------------------------
 * Flow
 * ------------------------------------------------------------
 * 1. Extract normalized query parameters from `req.normalizedQuery`
 *    (populated by query normalization middleware).
 * 2. Delegate to `fetchPaginatedLocationsService`.
 * 3. Return standardized JSON response `{ success, data, pagination }`.
 * 4. Log structured audit information.
 *
 * ------------------------------------------------------------
 * Example Request
 * ------------------------------------------------------------
 * GET /api/locations?page=1&limit=10&sortBy=created_at&sortOrder=DESC&city=Toronto
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getPaginatedLocationsController = wrapAsync(async (req, res) => {
  const logContext = 'locations-controller/getPaginatedLocationsController';
  
  const {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    filters = {},
  } = req.normalizedQuery ?? {};
  
  // ------------------------------------------------------------
  // Step 1: Delegate to service layer
  // ------------------------------------------------------------
  const result = await fetchPaginatedLocationsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  const { data, pagination } = result ?? {
    data: [],
    pagination: { page, limit, totalRecords: 0, totalPages: 0 },
  };
  
  // ------------------------------------------------------------
  // Step 2: Handle empty result
  // ------------------------------------------------------------
  if (!data || data.length === 0) {
    logInfo('No locations found for current query', req, {
      context: logContext,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      userId: req.user?.id,
    });
    
    return res.status(200).json({
      success: true,
      message: 'No locations found for the given criteria.',
      data: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: 0,
        totalPages: 0,
      },
    });
  }
  
  // ------------------------------------------------------------
  // Step 3: Return success response
  // ------------------------------------------------------------
  logInfo('Fetched paginated locations successfully', req, {
    context: logContext,
    filters,
    pagination,
    sorting: { sortBy, sortOrder },
    userId: req.user?.id,
  });
  
  return res.status(200).json({
    success: true,
    message: 'Locations fetched successfully.',
    data,
    pagination,
  });
});

module.exports = {
  getPaginatedLocationsController,
};
