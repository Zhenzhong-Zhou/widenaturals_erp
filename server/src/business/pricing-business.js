const { logSystemWarn } = require('../utils/system-logger');

/**
 * Resolves the final price for an order item based on submitted price and DB price.
 *
 * Applies business rules:
 * - If submitted price equals DB price → use DB price
 * - If submitted price is positive and different → allow manual price (override)
 * - Otherwise fallback to DB price
 *
 * @param {number|string|null|undefined} submittedPrice - Price submitted by client
 * @param {number|string} dbPrice - Price from DB
 * @returns {number} - Final price to apply
 */
const resolveFinalPrice = (submittedPrice, dbPrice) => {
  const cleanSubmittedPrice = parseFloat(submittedPrice);
  const cleanDbPrice = parseFloat(dbPrice);
  
  if (isNaN(cleanSubmittedPrice)) {
    return cleanDbPrice;
  }
  
  if (cleanSubmittedPrice === cleanDbPrice) {
    return cleanDbPrice;
  }
  
  if (cleanSubmittedPrice > 0 && cleanSubmittedPrice !== cleanDbPrice) {
    logSystemWarn('Manual price override applied', {
      submittedPrice: cleanSubmittedPrice,
      dbPrice: cleanDbPrice,
    });
    // Optionally log manual override here if you want
    return cleanSubmittedPrice;
  }
  
  return cleanDbPrice;
};

module.exports = {
  resolveFinalPrice,
};
