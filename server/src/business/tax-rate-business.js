const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Calculates the taxable amount and tax amount for a sales order.
 *
 * Applies business rules: ensures taxable amount is never below zero,
 * and calculates tax as a percentage of the post-discount subtotal.
 *
 * @param {number} subtotal - The subtotal amount before discounts and tax.
 * @param {number} discountAmount - The discount to subtract from subtotal.
 * @param {number} taxRate - The tax rate (e.g., 5 for 5%).
 * @returns {{
 *   taxableAmount: number;
 *   taxAmount: number;
 * }} - The calculated taxable amount and tax amount.
 *
 * @throws {AppError} - If calculation fails unexpectedly.
 */
const calculateTaxableAmount = (subtotal, discountAmount, taxRate) => {
  try {
    const taxableAmount = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxableAmount * (taxRate / 100);
    
    return {
      taxableAmount,
      taxAmount,
    };
  } catch (error) {
    logSystemException(error, 'Failed to calculate taxable amount and tax', {
      context: 'order-business/calculateTaxableAmount',
      subtotal,
      discountAmount,
      taxRate,
    });
    
    throw AppError.businessError('Unable to calculate tax amounts.');
  }
};

module.exports = {
  calculateTaxableAmount,
};
