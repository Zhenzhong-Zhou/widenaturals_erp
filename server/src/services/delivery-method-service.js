const {
  getDeliveryMethodsForDropdown,
} = require('../repositories/delivery-method-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Service function to retrieve available delivery methods.
 * This function applies business logic such as filtering and formatting.
 * @param {boolean} includePickup - Whether to include In-Store Pickup methods.
 * @returns {Promise<Array<{ id: string, name: string, estimatedTime: { days: number } }>>}
 */
const fetchAvailableMethodsForDropdown = async (includePickup = false) => {
  try {
    const methods = await getDeliveryMethodsForDropdown(includePickup);

    // Apply business logic and formatting
    return methods.map((method) => ({
      id: method.id,
      name: method.name,
      estimatedTime:
        method.estimatedtime && method.estimatedtime.days
          ? { days: parseInt(method.estimatedtime.days, 10) }
          : null, // Return null if estimatedtime is null or doesn't have days
    }));
  } catch (error) {
    logError('Error in delivery method service:', error);
    throw AppError.serviceError('Failed to retrieve delivery methods');
  }
};

module.exports = {
  fetchAvailableMethodsForDropdown,
};
