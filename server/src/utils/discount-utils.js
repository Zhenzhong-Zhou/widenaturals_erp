/**
 * Formats discount value based on its type.
 *
 * @param {string|null} discountType - The type of discount (PERCENTAGE or FIXED_AMOUNT).
 * @param {number|null} discountValue - The value of the discount.
 * @returns {string} - Formatted discount value.
 */
const formatDiscount = (discountType, discountValue) => {
  if (!discountType || discountValue === null || discountValue === undefined)
    return 'N/A';
  
  if (discountType === 'PERCENTAGE')
    return `${Number(discountValue).toFixed(2)}%`;
  if (discountType === 'FIXED_AMOUNT')
    return `$${Number(discountValue).toFixed(2)}`;
  
  return 'N/A';
};

module.exports = {
  formatDiscount,
};
