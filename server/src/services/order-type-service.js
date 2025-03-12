const { getAllOrderTypes } = require('../repositories/order-type-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Fetch all order types with business logic
 * @returns {Promise<Array>} List of order types
 */
const fetchAllOrderTypes = async () => {
  try {
    const orderTypes = await getAllOrderTypes();
    
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
