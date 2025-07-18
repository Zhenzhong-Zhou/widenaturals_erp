const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { getFieldsById } = require('../database/db');
const AppError = require('./AppError');

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
  logistics: 'LO',
};

/**
 * Generates a new order ID and order number based on order_type_id and category integrity.
 *
 * Fetches the order type name and category from the `order_types` table,
 * verifies that the DB category matches the expected category,
 * and generates a unique order number.
 *
 * @param {string} order_type_id - The order type ID (used to fetch name and category)
 * @param {string} expectedCategory - The category expected for this order (e.g. 'sales', 'purchase')
 * @param {PoolClient} client - DB client within transaction
 * @returns {Promise<{ id: string, category: string, orderNumber: string }>} - Generated identifiers
 *
 * @throws {AppError} - Throws notFoundError if an order type not found,
 *                     or validationError if category mismatch
 */
const generateOrderIdentifiers = async (
  order_type_id,
  expectedCategory,
  client
) => {
  const id = uuidv4();

  const orderTypeFields = await getFieldsById(
    'order_types',
    order_type_id,
    ['name', 'category'],
    client
  );
  if (!orderTypeFields) {
    throw AppError.notFoundError(
      `Order type not found for ID: ${order_type_id}`
    );
  }

  const { name, category } = orderTypeFields;

  if (category !== expectedCategory.toLowerCase()) {
    throw AppError.validationError(
      `Order type ID does not belong to category ${expectedCategory}`
    );
  }

  const orderNumber = generateOrderNumber(name, category, id);

  return { id, orderNumber };
};

/**
 * Generates a prefix by taking the first letter of each word in the order type name.
 * @param {string} orderTypeName - The name of the order type (e.g., "Standard Sales Order").
 * @returns {string} - The generated prefix (e.g., "SSO" for "Standard Sales Order").
 */
const generateOrderNamePrefix = (orderTypeName) => {
  return orderTypeName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
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
  if (!orderTypeName || typeof orderTypeName !== 'string') {
    throw AppError.validationError('Invalid orderTypeName provided.');
  }

  const categoryPrefix = categoryToPrefixMap[category] || 'UN'; // 'UN' = Undefined if category not mapped
  const orderTypePrefix = generateOrderNamePrefix(orderTypeName);

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14);
  const baseOrderNumber = `${categoryPrefix}-${orderTypePrefix}-${timestamp}-${orderId.slice(0, 8)}`;

  // Generate SHA-256 hash and take the first 4 characters as the checksum
  const hash = crypto
    .createHash('sha256')
    .update(baseOrderNumber)
    .digest('hex');
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

  const [
    categoryPrefix,
    orderTypePrefix,
    timestamp,
    orderId,
    providedChecksum,
  ] = parts;
  const baseOrderNumber = `${categoryPrefix}-${orderTypePrefix}-${timestamp}-${orderId}`;

  // Recalculate the checksum using the same hashing algorithm
  const hash = crypto
    .createHash('sha256')
    .update(baseOrderNumber)
    .digest('hex');
  const calculatedChecksum = hash.slice(0, 10);

  return providedChecksum === calculatedChecksum;
};

module.exports = {
  generateOrderIdentifiers,
  verifyOrderNumber,
};
