const AppError = require('../utils/AppError');
const { getStatusIdByName } = require('../repositories/status-repository');
const { validateCustomer } = require('../validators/customer-validator');
const {
  bulkCreateCustomers,
  getAllCustomers,
  getCustomersForDropdown,
  getCustomerById,
} = require('../repositories/customer-repository');
const { logError } = require('../utils/logger-helper');

/**
 * Creates multiple customers in bulk.
 * @param {Array} customers - List of customer objects.
 * @param {String} createdBy - User ID from JWT token.
 * @returns {Promise<Array>} - The inserted customers.
 */
const createCustomers = async (customers, createdBy) => {
  if (!Array.isArray(customers) || customers.length === 0) {
    throw AppError.validationError('Customer list is empty.');
  }

  // Fetch the active status ID
  const activeStatusId = await getStatusIdByName('active');
  if (!activeStatusId) {
    throw AppError.databaseError('Active status ID not found.');
  }

  // Validate customers concurrently
  await Promise.all(customers.map(validateCustomer));

  // Transform customers with default values
  const transformedCustomers = customers.map((customer) => ({
    ...customer,
    status_id: activeStatusId, // Always set status as active
    created_by: createdBy, // Extract from token
    updated_by: createdBy, // Updated by same user initially
  }));

  // Bulk insert customers (handling conflicts)
  return bulkCreateCustomers(transformedCustomers);
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
 */
const fetchCustomerDetails = async (customerId) => {
  return await getCustomerById(customerId);
};

module.exports = {
  createCustomers,
  fetchCustomersService,
  fetchCustomersDropdown,
  fetchCustomerDetails,
};
