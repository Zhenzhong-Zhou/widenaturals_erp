const AppError = require('../utils/AppError');
const { getStatusIdByName } = require('../repositories/status-repository');
const { validateCustomer } = require('../validators/customer-validator');
const { bulkCreateCustomers } = require('../repositories/customer-repository');

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
  
  // 🔹 Fetch the active status ID
  const activeStatusId = await getStatusIdByName('active');
  if (!activeStatusId) {
    throw AppError.databaseError("Active status ID not found.");
  }
  
  // 🔹 Validate customers concurrently
  await Promise.all(customers.map(validateCustomer));
  
  // 🔹 Transform customers with default values
  const transformedCustomers = customers.map(customer => ({
    ...customer,
    status_id: activeStatusId, // ✅ Always set status as active
    created_by: createdBy,     // ✅ Extract from token
    updated_by: createdBy,     // ✅ Updated by same user initially
  }));
  
  // 🔹 Bulk insert customers (handling conflicts)
  return bulkCreateCustomers(transformedCustomers);
};

module.exports = { createCustomers };
