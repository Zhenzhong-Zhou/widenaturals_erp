/**
 * @file sales-order-repository.js
 * @description Database access layer for sales order records.
 *
 * Exports:
 *  - insertSalesOrder — insert a single sales order record
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { SALES_ORDER_INSERT_QUERY } = require('./queries/sales-order-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts a new sales order record and returns the generated ID.
 *
 * @param {InsertSalesOrderPayload}  salesOrderData
 * @param {PoolClient} client - DB client for transactional context.
 *
 * @returns {Promise<string>} UUID of the inserted sales order.
 * @throws  {AppError}        Normalized database error if the insert fails.
 */
const insertSalesOrder = async (salesOrderData, client) => {
  const context = 'sales-order-repository/insertSalesOrder';

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
    const { rows } = await query(SALES_ORDER_INSERT_QUERY, values, client);
    return rows[0]?.id;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert sales order.',
      meta: { order_id: id, customer_id },
      logFn: (err) =>
        logDbQueryError(SALES_ORDER_INSERT_QUERY, values, err, {
          context,
          order_id: id,
        }),
    });
  }
};

module.exports = {
  insertSalesOrder,
};
