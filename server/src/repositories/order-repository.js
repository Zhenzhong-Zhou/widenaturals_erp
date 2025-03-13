const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
/**
 * Creates a general order in the `orders` table using raw SQL.
 * @param {Object} orderData - Order details.
 * @returns {Promise<Object>} - The created order.
 */
const createOrder = async (orderData) => {
  const {
    order_type_id,
    order_date,
    order_status_id,
    metadata,
    note,
    created_by,
    updated_by,
  } = orderData;

  const sql = `
    INSERT INTO orders (
      order_type_id,
      order_date,
      order_status_id,
      metadata,
      note,
      created_by,
      updated_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;
  `;

  const values = [
    order_type_id,
    order_date,
    order_status_id,
    metadata || null,
    note,
    created_by,
    updated_by,
  ];

  try {
    const result = await query(sql, values);
    return result.rows[0]; // Returning the created order
  } catch (error) {
    logError(`Error creating order`, error);
    throw AppError.databaseError(`Failed to create order: ${error.message}`);
  }
};

const getOrderDetailsById = async (orderId) => {
  const sql = `
    SELECT
        o.id AS order_id,
        o.order_date,
        o.note AS order_note,
        os.name AS order_status,
        s.id AS sales_order_id,
        s.customer_id,
        COALESCE(c.firstname, '') || ' ' || COALESCE(c.lastname, '') AS customer_name,
        s.discount_amount,
        s.subtotal,
        s.total_amount,
        s.shipping_fee,
        s.total_amount,
        d.discount_value,
        d.discount_type,
        t.rate AS tax_rate,
        oi.id AS order_item_id,
        oi.product_id,
        p.product_name AS product_name,
        oi.quantity_ordered,
        oi.quantity_fulfilled,
        oi.price_id,
        oi.price,
        ps.price_type_id,
        pt.name AS price_type,
        oi.status_id AS order_item_status_id,
        ist.name AS order_item_status_name
    FROM orders o
    LEFT JOIN sales_orders s ON o.id = s.id
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN order_status os ON o.order_status_id = os.id
    LEFT JOIN discounts d ON s.discount_id = d.id
    LEFT JOIN tax_rates t ON s.tax_rate_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN pricing ps ON oi.price_id = ps.id
    LEFT JOIN pricing_types pt ON ps.price_type_id = pt.id
    LEFT JOIN order_status ist ON oi.status_id = ist.id
    WHERE o.id = $1
  `;
  console.log(sql, [orderId]);
  try {
    const { rows } = await query(sql, [orderId]);
    return rows.length > 0 ? rows : null;
  } catch (error) {
    console.log(error);
    logError(`Error fetching order details for ID: ${orderId}`, error);
    throw AppError.databaseError('Failed to fetch order details.');
  }
};

module.exports = {
  createOrder,
  getOrderDetailsById,
};
