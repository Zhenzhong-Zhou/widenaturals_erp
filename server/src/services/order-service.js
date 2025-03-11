const { createOrder, getOrderDetailsById } = require('../repositories/order-repository');
const { createSalesOrder } = require('../repositories/sales-order-repository');
const { getOrderTypeByIdOrName } = require('../repositories/order-type-repository');
const AppError = require('../utils/AppError');

/**
 * Creates an order dynamically based on its type.
 * Dynamically determines order processing based on category.
 *
 * @param {Object} orderData - Order details.
 * @returns {Promise<Object>} - The created order.
 */
const createOrderByType = async (orderData) => {
  // Step 1: Fetch order type details based on `order_type_id`
  const orderType = await getOrderTypeByIdOrName({ id: orderData.order_type_id });
  
  if (!orderType) {
    throw AppError.databaseError('Invalid order type provided.');
  }
  
  // Step 2: Route to the correct order creation function
  switch (orderType.category) {
    case 'sales':
      return createSalesOrder(orderData); // 🔹 Calls `createSalesOrder`
    
    case 'purchase':
    case 'transfer':
    case 'return':
    case 'manufacturing':
    case 'adjustment':
    case 'logistics':
      return createOrder(orderData); // 🔹 Calls `createOrder` for other order types
    
    default:
      throw AppError.validationError(`Unsupported order category: ${orderType.category}`);
  }
};

/**
 * Fetches order details by ID, ensuring business logic is applied.
 *
 * @param {string} orderId - The ID of the order to fetch.
 * @param {Object} client - The database transaction client.
 * @returns {Promise<Object>} - The formatted order details.
 */
const fetchOrderDetails = async (orderId, client) => {
  if (!orderId) {
    throw AppError.validationError('Order ID is required.');
  }
  
  // Fetch order details from the repository
  const orderRows = await getOrderDetailsById(orderId, client);
  
  if (!orderRows || orderRows.length === 0) {
    throw AppError.notFoundError(`Order with ID ${orderId} not found.`);
  }
  
  // ✅ Transform Data: Group order items under a single order object
  return {
    order_id: orderRows[0].order_id,
    order_date: orderRows[0].order_date,
    order_status: orderRows[0].order_status,
    note: orderRows[0].order_note,
    customer: {
      id: orderRows[0].customer_id,
      name: orderRows[0].customer_name,
    },
    discount: {
      id: orderRows[0].discount_id || null,
      type: orderRows[0].discount_type || null,
      value: orderRows[0].discount_value || 0,
      amount: orderRows[0].discount_amount || 0,
    },
    subtotal: orderRows[0].subtotal,
    tax: {
      rate: orderRows[0].tax_rate || 0,
      amount: orderRows[0].tax || 0,
    },
    shipping_fee: orderRows[0].shipping_fee || 0,
    total_amount: orderRows[0].total_amount,
    items: orderRows
      .filter((row) => row.order_item_id) // Exclude orders with no items
      .map((row) => ({
        id: row.order_item_id,
        product: {
          id: row.product_id,
          name: row.product_name,
        },
        quantity_ordered: row.quantity_ordered,
        quantity_fulfilled: row.quantity_fulfilled,
        price: {
          id: row.price_id,
          amount: row.price,
          type_id: row.price_type_id,
          type: row.price_type,
        },
        status: {
          id: row.order_item_status_id,
          name: row.order_item_status_name,
        },
      })),
  };
};

module.exports = {
  createOrderByType,
  fetchOrderDetails,
};
