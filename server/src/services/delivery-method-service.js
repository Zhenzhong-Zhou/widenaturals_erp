const { getDeliveryMethodsForDropdown } = require('../repositories/delivery-method-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Service function to retrieve available delivery methods.
 * This function applies business logic such as filtering and formatting.
 * @returns {Promise<Array>} - List of delivery methods (id, name, estimated time).
 */
const fetchAvailableMethodsForDropdown = async () => {
  try {
    const methods = await getDeliveryMethodsForDropdown();
    
    // Apply business logic (if needed)
    return methods.map(method => ({
      id: method.id,
      name: method.method_name,
      estimatedTime: method.estimated_time, // Ensuring consistent format
    }));
  } catch (error) {
    logError('Error in delivery method service:', error);
    throw AppError.serviceError('Failed to retrieve delivery methods');
  }
};

module.exports = {
  fetchAvailableMethodsForDropdown
};
