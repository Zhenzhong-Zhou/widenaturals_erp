const {
  createCustomersService,
  fetchCustomersService,
  fetchCustomersDropdown,
} = require('../services/customer-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { logError, logInfo } = require('../utils/logger-helper');
const { getCustomerDetailsLogic } = require('../business/customer-business');

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
    ...(customers.length > 1
      ? { customers: result }
      : { customer: result[0] }),
  });
});

const getCustomersController = wrapAsync(async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;

    const result = await fetchCustomersService({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error) {
    logError('Controller Error: Failed to fetch customers', error);
    next(error);
  }
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
const getCustomerByIdController = wrapAsync(async (req, res, next) => {
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
  getCustomersController,
  getCustomersDropdownController,
  getCustomerByIdController,
};
