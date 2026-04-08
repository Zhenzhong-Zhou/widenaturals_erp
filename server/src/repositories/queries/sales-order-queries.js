/**
 * @file sales-order-queries.js
 * @description SQL query constants for sales-order-repository.js.
 *
 * Exports:
 *  - SALES_ORDER_INSERT_QUERY — insert single sales order record
 */

'use strict';

// $1-$20 match the values array in insertSalesOrder.
// created_at uses NOW() — not a bound parameter.
const SALES_ORDER_INSERT_QUERY = `
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
    $1,  $2,  $3,  $4,  $5,
    $6,  $7,  $8,  $9,  $10,
    $11, $12, $13, $14, $15,
    $16, $17, NOW(), $18, $19,
    $20
  )
  RETURNING id
`;

module.exports = {
  SALES_ORDER_INSERT_QUERY
};
