const {
  createCustomersService,
  fetchPaginatedCustomersService,
} = require('../services/customer-service');
const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller to handle the creation of one or multiple customers.
 *
 * - Accepts an array of customer objects (even single inserts must be wrapped in an array).
 * - Validates the structure and enforces non-empty input.
 * - Adds created_by metadata from the authenticated user.
 * - Returns inserted customer records.
 */
const createCustomerController = wrapAsync(async (req, res) => {
  const customers = req.body;
  const user = req.user;

  logInfo('Creating customer record(s)', req, {
    context: 'customer-controller/createCustomerController',
    recordCount: customers.length,
    requestedBy: user.id,
    requestId: req.id,
    traceId: req.traceId,
  });

  const result = await createCustomersService(customers, user);

  res.status(201).json({
    success: true,
    message:
      customers.length > 1
        ? 'Bulk customers created successfully.'
        : 'Customer created successfully.',
    data: customers.length > 1 ? result : result[0],
  });
});

/**
 * Controller to handle GET /customers with pagination and optional filters.
 *
 * This controller:
 * - Extracts query parameters from the request
 * - Normalizes pagination and sort values
 * - Converts string filters (e.g., isArchived) to proper types
 * - Delegates to the service layer for permission-aware query logic
 * - Returns a paginated list of customers in API-ready format
 *
 * Query Parameters:
 * - page (number): Page number for pagination (default: 1)
 * - limit (number): Items per page (default: 10, max: 100)
 * - sortBy (string): Logical field to sort by (mapped in service via customerSortMap)
 * - sortOrder (string): 'ASC' or 'DESC' (default: 'DESC')
 * - isArchived (boolean): 'true' | 'false' | undefined
 * - Other filters: region, country, createdBy, keyword, createdAfter, createdBefore, statusDateAfter, statusDateBefore
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>} - Responds with JSON on success
 */
const getPaginatedCustomersController = wrapAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

  const { data, pagination } = await fetchPaginatedCustomersService({
    user: req.user,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    success: true,
    message: 'Customers retrieved successfully.',
    data,
    pagination,
  });
});

module.exports = {
  createCustomerController,
  getPaginatedCustomersController,
};
