/**
 * Determines the stock level based on available quantity.
 * @param {number} availableQty
 * @returns {'none' | 'critical' | 'low' | 'normal'}
 */
const getStockLevel = (availableQty) => {
  if (availableQty === 0) return 'none';
  if (availableQty <= 10) return 'critical';
  if (availableQty <= 30) return 'low';
  return 'normal';
};

/**
 * Determines the severity of expiry based on expiry date.
 * @param {Date|null} expiryDate
 * @returns {string}
 */
const getExpirySeverity = (expiryDate) => {
  if (!expiryDate) return 'unknown';
  const today = new Date();
  const daysLeft = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 90) return 'expired_soon';
  if (daysLeft <= 180) return 'critical';
  if (daysLeft <= 365) return 'warning';
  if (daysLeft <= 547) return 'notice';
  return 'safe';
};

module.exports = {
  getStockLevel,
  getExpirySeverity,
};
