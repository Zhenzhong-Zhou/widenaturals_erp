const AppError = require('../utils/AppError');
const {
  bulkCreateCustomers,
  getAllCustomers,
  getCustomersForDropdown,
  getCustomerDetailsById,
} = require('../repositories/customer-repository');
const { prepareCustomersForInsert } = require('../shared/customer-utils');
const { logError } = require('../utils/logger-helper');
const { withTransaction } = require('../database/db');
const {
  transformCustomerDetails,
} = require('../transformers/customer-transformer');

/**
 * Creates multiple customers in bulk with validation and conflict handling.
 * Wraps the insertion in a database transaction.
 *
 * @param {Array} customers - List of customer objects.
 * @param {String} createdBy - ID of the user initiating the operation.
 * @returns {Promise<Array>} - Inserted or updated customer records.
 */
const createCustomers = async (customers, createdBy) => {
  return withTransaction(async (client) => {
    try {
      const preparedCustomers = await prepareCustomersForInsert(
        customers,
        createdBy
      );
      return await bulkCreateCustomers(preparedCustomers, client);
    } catch (error) {
      throw AppError.serviceError(
        'Failed to create customers in transaction',
        error
      );
    }
  });
};

/**
 * Service function to fetch paginated customer data.
 *
 * This function applies additional business logic, such as data transformation,
 * filtering, and security validations before calling the repository function.
 *
 * @param {Object} options - Options for pagination, sorting, and filtering.
 * @param {number} options.page - Page number for pagination.
 * @param {number} options.limit - Number of records per page.
 * @param {string} options.sortBy - Field to sort by.
 * @param {string} options.sortOrder - Sort order (ASC/DESC).
 * @returns {Promise<Object>} - Returns formatted customer data.
 * @throws {Error} - Throws an error if the repository call fails.
 */
const fetchCustomersService = async ({
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'DESC',
}) => {
  try {
    const { data, pagination } = await getAllCustomers(
      page,
      limit,
      sortBy,
      sortOrder
    );

    return {
      success: true,
      message: 'Customers retrieved successfully.',
      data,
      pagination,
    };
  } catch (error) {
    logError('Service Error: Failed to fetch customers', error);
    throw AppError.databaseError('Failed to retrieve customers.');
  }
};

/**
 * Service function to fetch customer data for dropdown.
 * - If `search` is empty, returns first 100 customers.
 * - If `search` is provided, fetches matching customers.
 *
 * @param {string} [search=""] - Optional search term (name, email, or phone).
 * @param {number} [limit=100] - Number of results to return.
 * @returns {Promise<Object>} - Returns an array of customer objects.
 */
const fetchCustomersDropdown = async (search = '', limit = 100) => {
  try {
    return await getCustomersForDropdown(search, limit);
  } catch (error) {
    logError('Service Error: Failed to fetch customers for dropdown', error);
    throw AppError.serviceError('Unable to fetch customer dropdown.');
  }
};

/**
 * Fetch customer details service function.
 * @param {string} customerId - Customer ID to retrieve details.
 * @returns {Promise<Object>} - Returns customer details.
 * @throws Will throw an error if the fetch fails.
 */
const fetchCustomerDetails = async (customerId) => {
  try {
    const row = await getCustomerDetailsById(customerId);
    if (!row) {
      throw AppError.notFoundError('Customer not found');
    }
    return transformCustomerDetails(row);
  } catch (error) {
    logError('Error fetching customer details:', error.message);
    throw AppError.serviceError('Failed to fetch customer details.');
  }
};

module.exports = {
  createCustomers,
  fetchCustomersService,
  fetchCustomersDropdown,
  fetchCustomerDetails,
};
