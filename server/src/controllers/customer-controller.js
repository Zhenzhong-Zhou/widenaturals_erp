const {
  createCustomers,
  fetchCustomersService,
  fetchCustomersDropdown,
} = require('../services/customer-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { logError } = require('../utils/logger-helper');
const { getCustomerDetailsLogic } = require('../business/customer-business');

/**
 * Handles creating a single customer or multiple customers.
 * Determines if the request is for bulk or single insert based on input type.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const createCustomerController = wrapAsync(async (req, res, next) => {
  try {
    let customers = req.body;
    const createdBy = req.user.id; // Extract user from token

    if (!Array.isArray(customers) && typeof customers !== 'object') {
      throw AppError.validationError(
        'Invalid input: Expected an object or an array of objects.'
      );
    }

    let result;
    if (Array.isArray(customers)) {
      // Bulk Insert
      result = await createCustomers(customers, createdBy);
      res.status(201).json({
        success: true,
        message: 'Bulk customers created successfully.',
        customers: result,
      });
    } else {
      // Single Insert
      result = await createCustomers(customers, createdBy);
      res.status(201).json({
        success: true,
        message: 'Customer created successfully.',
        customer: result,
      });
    }
  } catch (error) {
    next(error);
  }
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
