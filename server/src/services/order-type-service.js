const { getAllOrderTypes } = require('../repositories/order-type-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Fetch all order types with business logic
 * @returns {Promise<Array>} List of order types
 */
const fetchAllOrderTypes = async (page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') => {
  try {
    // Ensure valid pagination params
    if (page < 1 || limit < 1) {
      throw AppError.validationError('Invalid pagination parameters');
    }
    
    const orderTypes = await getAllOrderTypes(page, limit, sortBy, sortOrder);
    
    if (!orderTypes || orderTypes.length === 0) {
      return { message: 'No order types found', data: [] };
    }
    
    return { message: 'Order types retrieved successfully', data: orderTypes };
  } catch (error) {
    logError('Error in getAllOrderTypes service:', error);
    throw AppError.serviceError('Failed to retrieve order types');
  }
};

module.exports = {
  fetchAllOrderTypes,
};
