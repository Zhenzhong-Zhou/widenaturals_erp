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
    
    const { data, pagination} = await getAllOrderTypes(page, limit, sortBy, sortOrder);
    
    if (!data || data.length === 0) {
      return {
        message: 'No order types found',
        data: [],
        pagination: { page: 0, limit: 0, totalRecords: 0, totalPages: 0 },
      };
    }
    
    return { message: 'Order types retrieved successfully', data, pagination };
  } catch (error) {
    logError('Error in getAllOrderTypes service:', error);
    throw AppError.serviceError('Failed to retrieve order types');
  }
};

module.exports = {
  fetchAllOrderTypes,
};
