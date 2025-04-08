const { fetchCustomerDetails } = require('../services/customer-service');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Business logic function to get customer details.
 * Performs higher-level orchestration or domain-specific checks.
 *
 * @param {string} customerId - Customer ID.
 * @returns {Promise<Object>} - Customer details object.
 * @throws Will throw an error if customer is not found or another error occurs.
 */
const getCustomerDetailsLogic = async (customerId) => {
  try {
    const customer = await fetchCustomerDetails(customerId);
    
    if (!customer || customer.statusName !== 'active') {
      throw AppError.validationError('Customer not active or not found');
    }
    
    // (Optional) Add computed values, e.g., full name lowercase
    customer.searchableName = customer.customerName.toLowerCase();
    
    return customer;
  } catch (error) {
    logError('Business logic failed in getCustomerDetailsLogic:', error.message);
    throw AppError.businessError('Business logic failed in getCustomerDetailsLogic:', error);
  }
};

module.exports = {
  getCustomerDetailsLogic
};
