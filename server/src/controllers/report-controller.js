const wrapAsync = require('../utils/wrap-async');
const {
  fetchInventoryActivityLogsService,
} = require('../services/report-service');

/**
 * Controller: Handles request to fetch inventory activity logs with filtering and pagination.
 *
 * This controller:
 * - Extracts normalized query parameters from `req.normalizedQuery` (provided by middleware)
 * - Extracts authenticated user from `req.user` for access control
 * - Passes filters, pagination, and sorting options to the service layer
 * - Returns the transformed logs along with pagination metadata
 *
 * @route GET /reports/inventory-activity
 * @param {import('express').Request} req - Express request with `normalizedQuery` and `user` properties
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
const getInventoryActivityLogsController = wrapAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

  const user = req.user;

  const { data, pagination } = await fetchInventoryActivityLogsService(
    {
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    },
    user
  );

  res.status(200).json({
    success: true,
    message: 'Inventory activity logs fetched successfully',
    data,
    pagination,
  });
});

module.exports = {
  getInventoryActivityLogsController,
};
