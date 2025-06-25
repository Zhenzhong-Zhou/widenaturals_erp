const {
  createCustomersService,
  fetchPaginatedCustomersService,
  fetchCustomersDropdown,
} = require('../services/customer-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { logError, logInfo } = require('../utils/logger-helper');
const { getCustomerDetailsLogic } = require('../business/customer-business');
const { normalizePaginationParams } = require('../utils/request-utils');

/**
 * Controller to handle the creation of one or multiple customers.
 *
 * - Accepts an array of customer objects (even single inserts must be wrapped in an array).
 * - Validates the structure and enforces non-empty input.
 * - Adds created_by metadata from the authenticated user.
 * - Returns inserted customer records.
 */
const createCustomerController = wrapAsync(async (req, res, next) => {
  const customers = req.body;
  const user = req.user;
  
  if (!user?.id) {
    return next(AppError.validationError('Missing authenticated user.'));
  }
  
  if (!Array.isArray(customers) || customers.length === 0) {
    return next(
      AppError.validationError('Expected a non-empty array of customers.')
    );
  }
  
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
  const { page, limit, sortOrder } = normalizePaginationParams(req.query);
  
  const { sortBy = 'createdAt', ...restQuery } = req.query;
  
  const filters = { ...restQuery };
  
  const { data, pagination} = await fetchPaginatedCustomersService({
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

const getCustomersDropdownController = wrapAsync(async (req, res, next) => {
  try {
    const { search } = req.query;
    const customers = await fetchCustomersDropdown(search);

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    logError('Controller Error: Failed to fetch customer dropdown', error);
    next(error);
  }
});

/**
 * Controller to fetch customer details by ID.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const getCustomerByIdController = wrapAsync(async (req, res) => {
  const { id } = req.params; // Get customer ID from request params
  const customer = await getCustomerDetailsLogic(id);

  res.status(200).json({
    success: true,
    message: 'Customer retrieved successfully.',
    data: customer,
  });
});

module.exports = {
  createCustomerController,
  getPaginatedCustomersController,
  getCustomersDropdownController,
  getCustomerByIdController,
};
