const crypto = require('crypto');

/**
 * Maps category names to short prefixes.
 */
const categoryToPrefixMap = {
  purchase: 'PO',
  transfer: 'TO',
  sales: 'SO',
  return: 'RO',
  manufacturing: 'MO',
  adjustment: 'AO',
  logistics: 'LO'
};

/**
 * Generates a prefix by taking the first letter of each word in the order type name.
 * @param {string} orderTypeName - The name of the order type (e.g., "Standard Sales Order").
 * @returns {string} - The generated prefix (e.g., "SSO" for "Standard Sales Order").
 */
const generateOrderNamePrefix = (orderTypeName) => {
  return orderTypeName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

/**
 * Generates a unique order number with a prefix and SHA-256 checksum.
 * @param {string} category - Category for the order type (e.g., "purchase", "sales").
 * @param {string} orderTypeName - The name of the order type (e.g., "Standard Sales Order").
 * @param {string} orderId - The UUID or unique identifier of the order.
 * @returns {string} - Generated order number.
 */
const generateOrderNumber = (category, orderTypeName, orderId) => {
  const categoryPrefix = categoryToPrefixMap[category] || 'UN'; // 'UN' = Undefined if category not mapped
  const orderTypePrefix = generateOrderNamePrefix(orderTypeName);
  
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const baseOrderNumber = `${categoryPrefix}-${orderTypePrefix}-${timestamp}-${orderId.slice(0, 8)}`;
  
  // Generate a SHA-256 hash and take the first 4 characters as the checksum
  const hash = crypto.createHash('sha256').update(baseOrderNumber).digest('hex');
  const checksum = hash.slice(0, 10);
  
  return `${baseOrderNumber}-${checksum}`;
};

/**
 * Verifies if the given order number is valid based on its SHA-256 checksum.
 * @param {string} orderNumber - The order number to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
const verifyOrderNumber = (orderNumber) => {
  const parts = orderNumber.split('-');
  if (parts.length !== 5) return false;
  
  const [categoryPrefix, orderTypePrefix, timestamp, orderId, providedChecksum] = parts;
  const baseOrderNumber = `${categoryPrefix}-${orderTypePrefix}-${timestamp}-${orderId}`;
  
  // Recalculate the checksum using the same hashing algorithm
  const hash = crypto.createHash('sha256').update(baseOrderNumber).digest('hex');
  const calculatedChecksum = hash.slice(0, 10);
  
  return providedChecksum === calculatedChecksum;
};

module.exports = {
  generateOrderNumber,
  verifyOrderNumber
};
