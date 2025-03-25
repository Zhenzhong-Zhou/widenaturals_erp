const { getActiveDiscounts } = require('../repositories/discount-repository');
const { AppError } = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { formatDiscount } = require('../utils/string-utils');

/**
 * Business logic for fetching and formatting active discounts
 * @returns {Promise<Array>} - List of formatted discounts
 */
const fetchAvailableDiscounts = async () => {
  try {
    // Step 1: Fetch active discounts from the repository
    const discounts = await getActiveDiscounts();
    
    if (!discounts || discounts.length === 0) {
      throw AppError.notFoundError('No active discounts available');
    }
    
    // Step 2: Apply business logic for formatting
    return discounts.map((discount) => ({
      id: discount.id,
      name: discount.name,
      displayValue: formatDiscount(discount.discount_type, discount.discount_value),
    }));
    
  } catch (error) {
    logError('Error in fetchAvailableDiscounts:', error);
    throw AppError.serviceError('Failed to process discount data');
  }
};

module.exports = {
  fetchAvailableDiscounts,
};
