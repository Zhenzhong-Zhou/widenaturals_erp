const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedComplianceRecordsService,
} = require('../services/compliance-record-service');

/**
 * Controller: GET /compliance-records
 *
 * Fetches paginated, filtered, and sorted compliance records.
 *
 * Expects `req.normalizedQuery` to contain:
 *   - filters: Normalized filter options for compliance records.
 *   - page: Page number (1-based).
 *   - limit: Page size.
 *   - sortBy: SQL-safe column name.
 *   - sortOrder: 'ASC' | 'DESC'.
 *
 * Response:
 *   {
 *     success: true,
 *     message: string,
 *     data: Array<Object>,
 *     pagination: {
 *       page: number,
 *       limit: number,
 *       totalRecords: number,
 *       totalPages: number
 *     }
 *   }
 *
 * Middleware requirements:
 *   - `normalizeQuery` must populate `req.normalizedQuery`.
 *   - `verifyToken` and/or `authorize` (if permission is required).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const getPaginatedComplianceRecordsController = wrapAsync(async (req, res) => {
  const context =
    'compliance-controller/fetchPaginatedComplianceRecordsController';
  const startTime = Date.now();

  // --------------------------------------
  // Extract normalized query parameters
  // --------------------------------------
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

  // --------------------------------------
  // Log incoming request metadata
  // --------------------------------------
  logInfo('Incoming compliance record pagination request', req, {
    context,
    filters,
    pagination: { page, limit },
    sort: { sortBy, sortOrder },
    userId: req.user?.id,
  });

  // --------------------------------------
  // Fetch paginated compliance records
  // --------------------------------------
  const { data, pagination } = await fetchPaginatedComplianceRecordsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const elapsedMs = Date.now() - startTime;

  // --------------------------------------
  // Log completion metadata
  // --------------------------------------
  logInfo('', req, {
    context,
    filters,
    pagination,
    sort: { sortBy, sortOrder },
    elapsedMs,
  });

  // --------------------------------------
  // Send API response
  // --------------------------------------
  res.status(200).json({
    success: true,
    message: 'Compliance records fetched successfully.',
    data,
    pagination,
  });
});

module.exports = {
  getPaginatedComplianceRecordsController,
};
