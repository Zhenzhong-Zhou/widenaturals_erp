const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedLocationTypesService,
  fetchLocationTypeDetailsService,
} = require('../services/location-type-service');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller: Fetch Paginated Location Types
 *
 * Handles GET requests for `/api/location-types`
 * with optional filters, sorting, and pagination.
 *
 * ------------------------------------------------------------
 * Flow
 * ------------------------------------------------------------
 * 1. Extract normalized query parameters from `req.normalizedQuery`
 *    (populated by query normalization middleware).
 * 2. Delegate to `fetchPaginatedLocationTypesService`.
 * 3. Return standardized JSON response `{ success, data, pagination }`.
 * 4. Log structured audit information.
 *
 * ------------------------------------------------------------
 * Example Request
 * ------------------------------------------------------------
 * GET /api/location-types?page=1&limit=10&sortBy=created_at&sortOrder=DESC&keyword=warehouse
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getPaginatedLocationTypesController = wrapAsync(async (req, res) => {
  const logContext =
    'location-types-controller/getPaginatedLocationTypesController';

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
  const result = await fetchPaginatedLocationTypesService({
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
    logInfo('No location types found for current query', req, {
      context: logContext,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      message: 'No location types found for the given criteria.',
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
  logInfo('Fetched paginated location types successfully', req, {
    context: logContext,
    filters,
    pagination,
    sorting: { sortBy, sortOrder },
    userId: req.user?.id,
  });

  return res.status(200).json({
    success: true,
    message: 'Location types fetched successfully.',
    data,
    pagination,
  });
});

/**
 * Controller: Fetch Location Type Details
 *
 * Handles GET requests for `/api/location-types/:locationTypeId`.
 * Retrieves a single location type record including its status
 * and audit information.
 *
 * ─────────────────────────────────────────────────────────────
 * Flow
 * ─────────────────────────────────────────────────────────────
 * 1. Extracts `locationTypeId` from `req.params`
 *    (validated by Joi middleware).
 * 2. Delegates to `fetchLocationTypeDetailsService`.
 * 3. Returns standardized JSON response `{ success, message, data }`.
 * 4. Handles not-found and unexpected errors via centralized middleware.
 * 5. Logs key events using structured logging.
 *
 * ─────────────────────────────────────────────────────────────
 * Example Request
 * ─────────────────────────────────────────────────────────────
 * GET /api/location-types/8d5b7e4f-9231-4b0f-83d1-6c8e3b03b8f2
 *
 * ─────────────────────────────────────────────────────────────
 * Example Response
 * ─────────────────────────────────────────────────────────────
 * {
 *   "success": true,
 *   "message": "Location type details fetched successfully.",
 *   "data": {
 *     "id": "uuid",
 *     "code": "WAREHOUSE",
 *     "name": "Warehouse",
 *     "description": "Physical storage location",
 *     "status": {
 *       "id": "uuid",
 *       "name": "Active",
 *       "date": "2026-02-14T20:00:00.000Z"
 *     },
 *     "audit": {
 *       "createdAt": "2026-01-01T10:00:00.000Z",
 *       "createdBy": {
 *         "id": "uuid",
 *         "fullName": "Root Admin"
 *       },
 *       "updatedAt": "2026-02-01T10:00:00.000Z",
 *       "updatedBy": {
 *         "id": "uuid",
 *         "fullName": "Jane Doe"
 *       }
 *     }
 *   }
 * }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getLocationTypeDetailsController = wrapAsync(async (req, res) => {
  const logContext =
    'location-types-controller/getLocationTypeDetailsController';

  const { locationTypeId } = req.params;

  // ----------------------------------------------------------
  // Step 1: Fetch location type detail via service layer
  // ----------------------------------------------------------
  const locationType = await fetchLocationTypeDetailsService(locationTypeId);

  // ----------------------------------------------------------
  // Step 2: Log success
  // ----------------------------------------------------------
  logInfo('Fetched location type detail successfully', req, {
    context: logContext,
    locationTypeId,
  });

  // ----------------------------------------------------------
  // Step 3: Return standardized response
  // ----------------------------------------------------------
  return res.status(200).json({
    success: true,
    message: 'Location type details fetched successfully.',
    data: locationType,
  });
});

module.exports = {
  getPaginatedLocationTypesController,
  getLocationTypeDetailsController,
};
