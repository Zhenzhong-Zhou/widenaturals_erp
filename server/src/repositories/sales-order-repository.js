const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Inserts a new sales order record into the `sales_orders` table.
 *
 * This function assumes that a corresponding `orders` entry (with the same ID) has already been created.
 * It records sales-specific fields such as payment details, tax, discount, delivery method, and amounts.
 *
 * @function insertSalesOrder
 * @param {Object} salesOrderData - The sales order data payload.
 * @param {string} salesOrderData.id - UUID of the corresponding order (must exist in `orders` table).
 * @param {string} salesOrderData.customer_id - UUID of the customer placing the order.
 * @param {string} salesOrderData.order_date - ISO-formatted order date (e.g., '2025-06-25').
 * @param {string} [salesOrderData.payment_status_id] - Optional UUID reference to `payment_status`.
 * @param {string} [salesOrderData.payment_method_id] - Optional UUID reference to `payment_methods`.
 * @param {string} [salesOrderData.currency_code='CAD'] - Currency code (e.g., 'CAD', 'USD').
 * @param {number} [salesOrderData.exchange_rate] - Optional exchange rate to base currency.
 * @param {number} [salesOrderData.base_currency_amount] - Optional amount in base currency.
 * @param {string} [salesOrderData.discount_id] - Optional UUID reference to `discounts`.
 * @param {number} [salesOrderData.discount_amount=0] - Discount amount (default 0).
 * @param {number} salesOrderData.subtotal - Subtotal before tax and fees.
 * @param {string} salesOrderData.tax_rate_id - UUID of the applied tax rate.
 * @param {number} [salesOrderData.tax_amount=0] - Tax amount (default 0).
 * @param {number} [salesOrderData.shipping_fee=0] - Shipping fee (default 0).
 * @param {number} salesOrderData.total_amount - Final total amount after all adjustments.
 * @param {string} salesOrderData.delivery_method_id - UUID reference to `delivery_methods`.
 * @param {string} [salesOrderData.created_by] - Optional user ID of the creator.
 * @param {import('pg').PoolClient} client - PostgreSQL client with an active transaction context.
 *
 * @throws {AppError} Throws a database error if the insert fails.
 *
 * @returns {Promise<void>} Resolves when the sales order has been successfully inserted.
 *
 * @example
 * await insertSalesOrder(client, {
 *   id: 'a1b2c3d4-...',
 *   customer_id: 'c123...',
 *   order_date: '2025-06-25',
 *   subtotal: 100.0,
 *   tax_rate_id: 't456...',
 *   total_amount: 113.0,
 *   delivery_method_id: 'd789...',
 *   created_by: 'u001...'
 * });
 */
const insertSalesOrder = async (salesOrderData, client) => {
  const {
    id,
    customer_id,
    order_date,
    payment_status_id = null,
    payment_method_id = null,
    currency_code = 'CAD',
    exchange_rate = null,
    base_currency_amount = null,
    discount_id = null,
    discount_amount = 0,
    subtotal,
    tax_rate_id,
    tax_amount = 0,
    shipping_fee = 0,
    total_amount,
    delivery_method_id,
    metadata = null,
    created_by = null,
    updated_at = null,
    updated_by = null,
  } = salesOrderData;

  const sql = `
    INSERT INTO sales_orders (
      id,
      customer_id,
      order_date,
      payment_status_id,
      payment_method_id,
      currency_code,
      exchange_rate,
      base_currency_amount,
      discount_id,
      discount_amount,
      subtotal,
      tax_rate_id,
      tax_amount,
      shipping_fee,
      total_amount,
      delivery_method_id,
      metadata,
      created_at,
      updated_at,
      created_by,
      updated_by
    )
    VALUES (
      $1,  $2, $3, $4, $5,
      $6,  $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, NOW(), $18, $19,
      $20
    )
    RETURNING id;
  `;

  const values = [
    id,
    customer_id,
    order_date,
    payment_status_id,
    payment_method_id,
    currency_code,
    exchange_rate,
    base_currency_amount,
    discount_id,
    discount_amount,
    subtotal,
    tax_rate_id,
    tax_amount,
    shipping_fee,
    total_amount,
    delivery_method_id,
    metadata,
    updated_at,
    created_by,
    updated_by,
  ];

  try {
    const { rows } = await query(sql, values, client);
    return rows[0]?.id;
  } catch (error) {
    logSystemException(
      error,
      'Database insert failed while creating a new sales order',
      {
        context: 'sales-order-repository/insertSalesOrder',
        payload: salesOrderData,
      }
    );

    throw AppError.databaseError(
      'Database insert failed: could not create new sales order.'
    );
  }
};

module.exports = {
  insertSalesOrder,
};
