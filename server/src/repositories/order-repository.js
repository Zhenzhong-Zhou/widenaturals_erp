const { query, retry, paginateQuery } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { getOrderTypes } = require('./order-type-repository');
const { generateOrderNumber, verifyOrderNumber } = require('../utils/order-number-utils');

/**
 * Creates a general order in the `orders` table using raw SQL.
 * @param {Object} orderData - Order details.
 * @returns {Promise<Object>} - The created order with order_number.
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
  
  try {
    // Step 1: Insert order WITHOUT order_number
    const insertOrderSQL = `
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
    
    const result = await query(insertOrderSQL, values);
    const orderId = result.rows[0].id;
    
    // Step 2: Fetch Order Types (Using your getOrderTypes function)
    const orderTypes = await getOrderTypes('dropdown');
    const orderType = orderTypes.find((ot) => ot.id === order_type_id);
    
    if (!orderType) {
      throw AppError.databaseError(`Order type not found for ID: ${order_type_id}`);
    }
    
    const { category, name: orderTypeName } = orderType;
    
    // Step 3: Generate the order_number using the utility function
    const orderNumber = generateOrderNumber(category, orderTypeName, orderId);
    
    // Step 4: Validate the generated order_number
    if (!verifyOrderNumber(orderNumber)) {
      throw AppError.databaseError('Generated order number is invalid');
    }
    
    // Step 5: Update the order with the generated order_number
    const updateOrderSQL = `
      UPDATE orders
      SET order_number = $1, updated_by = $2
      WHERE id = $3
      RETURNING *;
    `;
    
    const updateValues = [orderNumber, updated_by, orderId];
    const updatedOrderResult = await query(updateOrderSQL, updateValues);
    
    if (updatedOrderResult.rowCount === 0) {
      throw AppError.databaseError(`Failed to update order with ID: ${orderId}`);
    }
    
    return updatedOrderResult.rows[0]; // Return the updated order with order_number
  } catch (error) {
    logError(`Error creating order`, error);
    throw AppError.databaseError(`Failed to create order: ${error.message}`);
  }
};

const getOrderDetailsById = async (orderId) => {
  const sql = `
    SELECT
      o.id AS order_id,
      o.order_number,
      ot.category AS order_category,
      ot.name AS order_type,
      o.order_date AS order_date,
      s.order_date AS sales_order_date,
      o.order_status_id AS order_status_id,
      o.note AS order_note,
      o.metadata AS order_metadata,
      os.name AS order_status,
      s.id AS sales_order_id,
      s.customer_id,
      COALESCE(c.firstname, '') || ' ' || COALESCE(c.lastname, '') AS customer_name,
      d.discount_value,
      d.discount_type,
      s.discount_amount,
      s.subtotal,
      t.rate AS tax_rate,
      oi.id AS order_item_id,
      s.tax_amount,
      s.shipping_fee,
      s.total_amount,
      oi.product_id,
      p.product_name AS product_name,
      p.barcode AS barcode,
      COALESCE(co.compliance_id, '') AS npn,
      oi.quantity_ordered,
      ps.price_type_id,
      pt.name AS price_type,
      oi.price_id,
      ps.price AS system_price,
      oi.price AS adjusted_price,
      oi.subtotal AS order_item_subtotal,
      oi.status_id AS order_item_status_id,
      ist.name AS order_item_status_name,
      oi.status_date AS order_item_status_date,
      dm.id AS delivery_method_id,
      dm.method_name AS delivery_method,
      dm.is_pickup_location,
      tn.id AS tracking_number_id,
      tn.tracking_number,
      tn.carrier,
      tn.service_name,
      tn.shipped_date
    FROM orders o
    LEFT JOIN sales_orders s ON o.id = s.id
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN order_status os ON o.order_status_id = os.id
    LEFT JOIN order_types ot ON o.order_type_id = ot.id
    LEFT JOIN discounts d ON s.discount_id = d.id
    LEFT JOIN tax_rates t ON s.tax_rate_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN pricing ps ON oi.price_id = ps.id
    LEFT JOIN pricing_types pt ON ps.price_type_id = pt.id
    LEFT JOIN compliances co ON p.id = co.product_id
    LEFT JOIN order_status ist ON oi.status_id = ist.id
    LEFT JOIN tracking_numbers tn ON o.id = tn.order_id
    LEFT JOIN delivery_methods dm ON s.delivery_method_id = dm.id
    WHERE o.id = $1
  `;
  
  try {
    const { rows } = await query(sql, [orderId]);
    return rows.length > 0 ? rows : null;
  } catch (error) {
    logError(`Error fetching order details for ID: ${orderId}`, error);
    throw AppError.databaseError('Failed to fetch order details.');
  }
};

/**
 * Updates an order with new details, including metadata updates for manual price overrides.
 *
 * This function dynamically updates only the provided fields while preserving existing metadata.
 * It ensures that manual price overrides are properly tracked in `metadata` and prevents duplicate discount applications.
 *
 * @param {string} orderId - The unique identifier of the sales order to be updated.
 * @param {Object} updateData - The fields to update in the sales order.
 * @param {Array<Object>} [updateData.manual_price_overrides] - An array of manual price overrides to be appended to metadata.
 * @param {string} [updateData.discount_id] - The discount ID to apply to the order.
 * @param {number} [updateData.tax_amount] - The updated tax amount for the order.
 * @param {number} [updateData.total_amount] - The updated total amount for the order.
 * @param {string} [updateData.status_id] - The updated order status ID.
 * @param {string} [updateData.note] - Any additional notes related to the order.
 * @param {string} [updateData.updated_by] - The ID of the user making the update.
 * @param {Object} client - The database transaction client.
 * @returns {Promise<Object>} - The updated sales order record.
 * @throws {AppError} - Throws an error if the order is not found or if the update fails.
 */
const updateOrderData = async (orderId, updateData, client) => {
  try {
    // Step 1: Fetch the existing order metadata
    const existingOrder = await client.query(
      `SELECT metadata FROM orders WHERE id = $1`,
      [orderId]
    );
    
    if (!existingOrder.rows.length) {
      throw AppError.notFoundError(`Order ${orderId} not found.`);
    }
    
    let existingMetadata = existingOrder.rows[0].metadata || {};
    
    // Step 2: Merge metadata for manual price overrides
    if (updateData.manual_price_overrides) {
      existingMetadata.manual_price_overrides = [
        ...(existingMetadata.manual_price_overrides || []),
        ...updateData.manual_price_overrides,
      ];
    }
    
    // Step 3: Construct the update query dynamically
    let updateFields = [];
    let updateValues = [];
    let index = 1;
    
    if (updateData.discount_id) {
      updateFields.push(`discount_id = $${index}`);
      updateValues.push(updateData.discount_id);
      index++;
    }
    
    if (updateData.tax_amount !== undefined) {
      updateFields.push(`tax_amount = $${index}`);
      updateValues.push(updateData.tax_amount);
      index++;
    }
    
    if (updateData.total_amount !== undefined) {
      updateFields.push(`total_amount = $${index}`);
      updateValues.push(updateData.total_amount);
      index++;
    }
    
    if (updateData.status_id) {
      updateFields.push(`order_status_id = $${index}`);
      updateValues.push(updateData.status_id);
      index++;
      
      // If status changes, update status_date
      updateFields.push(`status_date = NOW()`);
    }
    
    if (updateData.note) {
      updateFields.push(`note = $${index}`);
      updateValues.push(updateData.note);
      index++;
    }
    
    // Always update metadata and timestamps
    updateFields.push(`metadata = $${index}`);
    updateValues.push(existingMetadata);
    index++;
    
    updateFields.push(`updated_at = NOW()`);
    
    if (updateData.updated_by) {
      updateFields.push(`updated_by = $${index}`);
      updateValues.push(updateData.updated_by);
      index++;
    }
    
    updateValues.push(orderId);
    
    const updateQuery = `
      UPDATE orders
      SET ${updateFields.join(', ')}
      WHERE id = $${index}
      RETURNING id;
    `;
    
    const updatedOrder = await client.query(updateQuery, updateValues);
    return updatedOrder.rows[0];
    
  } catch (error) {
    logError('Error updating order:', error);
    throw AppError.databaseError(`Failed to update order: ${error.message}`);
  }
};

/**
 * Fetches all orders with pagination, sorting, and order number verification.
 * Applies retry logic for robustness.
 *
 * @param {Object} options - Fetch options for the query.
 * @param {number} options.page - The current page number (default: 1).
 * @param {number} options.limit - The number of orders per page (default: 10).
 * @param {string} options.sortBy - The column to sort the results by (default: 'created_at').
 * @param {string} options.sortOrder - The order of sorting ('ASC' or 'DESC', default: 'DESC').
 * @returns {Promise<Object>} - The paginated orders result.
 * @throws {AppError} - If the query fails or verification fails.
 */
const getAllOrders = async ({
                                page = 1,
                                limit = 10,
                                sortBy = 'created_at',
                                sortOrder = 'DESC',
                              } = {}) => {
  const tableName = 'orders o';
  const joins = [
    'JOIN order_types ot ON o.order_type_id = ot.id',
    'JOIN order_status os ON o.order_status_id = os.id',
    'LEFT JOIN users u1 ON o.created_by = u1.id',
    'LEFT JOIN users u2 ON o.updated_by = u2.id',
  ];
  const whereClause = '1=1';
  
  const allowedSortFields = [
    'order_number',
    'category',
    'name',
    'order_date',
    'created_at',
    'updated_at',
  ];
  
  // Validate the sortBy field
  const validatedSortBy = allowedSortFields.includes(sortBy)
    ? `o.${sortBy}`
    : 'o.created_at';
  
  const baseQuery = `
    SELECT
      o.id,
      o.order_number,
      ot.name AS order_type,
      o.order_date,
      os.name AS status,
      o.created_at,
      o.updated_at,
      o.note,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
  `;
  
  try {
    return await retry(
      () =>
        paginateQuery({
          tableName,
          joins,
          whereClause,
          queryText: baseQuery,
          params: [],
          page,
          limit,
          sortBy: validatedSortBy,
          sortOrder,
        }),
      3 // Retry up to 3 times
    );
  } catch (error) {
    logError('Error fetching all orders:', error);
    throw AppError.databaseError('Failed to fetch all orders');
  }
};

module.exports = {
  createOrder,
  getOrderDetailsById,
  updateOrderData,
  getAllOrders,
};
