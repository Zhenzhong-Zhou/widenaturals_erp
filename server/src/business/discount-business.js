const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Calculates the discount amount based on discount type and subtotal.
 *
 * Applies business rules based on discount type (`PERCENTAGE` or `FIXED`).
 * Returns 0 if no discount is provided or type is unsupported.
 *
 * @param {number} subtotal - The original subtotal before discount.
 * @param {object|null} discount - The discount object containing type and value.
 * @param {string} discount.discount_type - Type of discount: 'PERCENTAGE' or 'FIXED'.
 * @param {number} discount.discount_value - The numeric value of the discount.
 * @returns {number} - The computed discount amount, or 0 if not applicable.
 *
 * @throws {AppError} - If a calculation error occurs.
 */
const calculateDiscountAmount = (subtotal, discount) => {
  try {
    if (!discount) return 0;
    
    if (discount.discount_type === 'PERCENTAGE') {
      return subtotal * (discount.discount_value / 100);
    }
    
    if (discount.discount_type === 'FIXED_AMOUNT') {
      return discount.discount_value;
    }
    
    // Throw for unsupported type
    throw AppError.validationError(`Unsupported discount type: ${discount.discount_type}`);
  } catch (error) {
    logSystemException(error, 'Failed to calculate discount amount', {
      context: 'discount-business/calculateDiscountAmount',
      discount,
      subtotal,
    });
    throw AppError.businessError('Unable to calculate discount amount.');
  }
};

module.exports = {
  calculateDiscountAmount,
};
