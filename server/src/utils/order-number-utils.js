/**
 * @file order-number-utils.js
 * @description
 * Generates order identifiers (UUID + human-readable order number) used across
 * the order domain: purchase, sales, transfer, return, manufacturing,
 * adjustment, and logistics orders.
 *
 * The human-readable order number is composed of:
 *   {categoryPrefix}-{orderTypePrefix}-{timestamp}-{uuid8}
 *
 * Examples:
 *   SO-SSO-20260417093012-a1b2c3d4
 *   PO-SPO-20260417093012-e5f6a7b8
 *
 * Pattern notes:
 *   - UUID v4 is the primary key; order number is a human-readable reference.
 *   - Uniqueness is guaranteed by the UUID; the order number is for display only.
 *   - `generateOrderIdentifiers` validates that the order type belongs to
 *     the expected category before emitting any identifiers.
 *
 * Named exports:
 *   - generateOrderIdentifiers
 */

'use strict';

const { randomUUID, createHash } = require('crypto');
const { getFieldsById } = require('./db/record-utils');
const AppError = require('./AppError');

/** @type {string} */
const CONTEXT = 'order-number-utils';

/**
 * Maps order category names to short 2-letter prefixes used in order numbers.
 * Keep keys lower-cased to match the `order_types.category` column values.
 *
 * @type {Record<string, string>}
 */
const CATEGORY_TO_PREFIX = {
  purchase:      'PO',
  transfer:      'TO',
  sales:         'SO',
  return:        'RO',
  manufacturing: 'MO',
  adjustment:    'AO',
  logistics:     'LO',
};

/**
 * Derives a short uppercase prefix from an order type name by taking the
 * first letter of each space-separated word.
 *
 * Example: "Standard Sales Order" -> "SSO"
 *
 * @param {string} orderTypeName
 * @returns {string}
 */
const generateOrderNamePrefix = (orderTypeName) => orderTypeName
  .split(' ')
  .map((word) => word.charAt(0).toUpperCase())
  .join('');

/**
 * Generates a unique order number with category prefix, order type initials,
 * timestamp, UUID fragment, and a 10-char SHA-256 checksum for integrity.
 *
 * Pure / deterministic given the same inputs at the same second.
 *
 * @param {string} category       Lowercase category (e.g. "purchase", "sales").
 * @param {string} orderTypeName  Human-readable order type name.
 * @param {string} orderId        Full UUID of the order (only first 8 chars used).
 * @returns {string}
 *
 * @throws {AppError} validationError when `orderTypeName` is missing or not a string.
 */
const generateOrderNumber = (category, orderTypeName, orderId) => {
  const context = `${CONTEXT}/generateOrderNumber`;
  
  if (!orderTypeName || typeof orderTypeName !== 'string') {
    throw AppError.validationError('Invalid orderTypeName provided.', {
      context,
      meta: { orderTypeName },
    });
  }
  
  const categoryPrefix = CATEGORY_TO_PREFIX[category] || 'UN';
  const orderTypePrefix = generateOrderNamePrefix(orderTypeName);
  
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14);
  
  const baseOrderNumber = `${categoryPrefix}-${orderTypePrefix}-${timestamp}-${orderId.slice(0, 8)}`;
  
  const checksum = createHash('sha256')
    .update(baseOrderNumber)
    .digest('hex')
    .slice(0, 10);
  
  return `${baseOrderNumber}-${checksum}`;
};

/**
 * Generates a new order identifier pair (UUID + human-readable order number)
 * for a given order type, after validating that the order type belongs to
 * the expected category.
 *
 * The category integrity check prevents callers from accidentally assigning
 * a purchase-type order to the sales pipeline (or vice versa) when both
 * order types are plausible in context.
 *
 * @param {string}     orderTypeId       Order type UUID (source of truth for name + category).
 * @param {string}     expectedCategory  Category the caller expects (e.g. 'sales', 'purchase').
 * @param {PoolClient} client            DB client within a transaction.
 * @returns {Promise<{ id: string, orderNumber: string }>}
 *
 * @throws {AppError} notFoundError when the order type ID does not resolve.
 * @throws {AppError} validationError when the order type category does not
 *         match `expectedCategory`.
 */
const generateOrderIdentifiers = async (
  orderTypeId,
  expectedCategory,
  client
) => {
  const context = `${CONTEXT}/generateOrderIdentifiers`;
  
  const id = randomUUID();
  
  const orderTypeFields = await getFieldsById(
    'order_types',
    orderTypeId,
    ['name', 'category'],
    client
  );
  if (!orderTypeFields) {
    throw AppError.notFoundError(
      `Order type not found for ID: ${orderTypeId}`,
      { context, meta: { orderTypeId } }
    );
  }
  
  const { name, category } = orderTypeFields;
  
  if (category?.toLowerCase() !== expectedCategory?.toLowerCase()) {
    throw AppError.validationError(
      `Order type ID does not belong to category ${expectedCategory}`,
      {
        context,
        meta: { orderTypeId, expectedCategory, actualCategory: category },
      }
    );
  }
  
  const orderNumber = generateOrderNumber(category, name, id);
  
  return { id, orderNumber };
};

module.exports = {
  generateOrderIdentifiers,
};
