const {
  createOrder,
  getOrderDetailsById, getAllOrders,
} = require('../repositories/order-repository');
const { createSalesOrder } = require('../repositories/sales-order-repository');
const {
  getOrderTypeByIdOrName, checkOrderTypeExists,
} = require('../repositories/order-type-repository');
const AppError = require('../utils/AppError');
const { verifyOrderNumber } = require('../utils/order-number-utils');
const { logError } = require('../utils/logger-helper');

/**
 * Creates an order dynamically based on its type.
 * Dynamically determines order processing based on category.
 *
 * @param {Object} orderData - Order details.
 * @returns {Promise<Object>} - The created order.
 */
const createOrderByType = async (orderData) => {
  // Step 1: Check if order type exists
  const orderTypeExists = await checkOrderTypeExists(orderData.order_type_id);
  
  if (!orderTypeExists) {
    throw AppError.validationError('Invalid order type provided.');
  }
  
  // Step 2: Fetch order type details based on `order_type_id`
  const orderType = await getOrderTypeByIdOrName({
    id: orderData.order_type_id,
  });
  
  if (!orderType) {
    throw AppError.databaseError('Failed to fetch order type details.');
  }
  
  // Step 3: Route to the correct order creation function
  switch (orderType.category) {
    case 'sales':
      return createSalesOrder(orderData);
    
    case 'purchase':
    case 'transfer':
    case 'return':
    case 'manufacturing':
    case 'adjustment':
    case 'logistics':
      return createOrder(orderData);
    
    default:
      throw AppError.validationError(
        `Unsupported order category: ${orderType.category}`
      );
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

/**
 * Transforms raw order data into a structured format.
 *
 * @param {Array} rawData - Raw order data fetched from the repository.
 * @param {boolean} verifyOrderNumbers - Whether to verify order numbers.
 * @returns {Array} - Transformed and verified order data.
 */
const transformOrders = (rawData, verifyOrderNumbers) => {
  return rawData.map(order => {
    // Verifying order number if required
    const isOrderNumberValid = verifyOrderNumbers ? verifyOrderNumber(order.order_number) : true;
    
    // Log error if invalid order number is detected
    if (!isOrderNumberValid) {
      logError(`Invalid order number detected: ${order.order_number}`);
    }
    
    // Transform order data structure
    return {
      id: order.id,
      order_number: order.order_number,
      order_number_valid: isOrderNumberValid,
      order_type: order.order_type,
      category: order.category,
      order_date: order.order_date,
      status: order.status,
      note: order.note,
      created_at: order.created_at,
      updated_at: order.updated_at,
      created_by: order.created_by,
      updated_by: order.updated_by
    };
  });
};

/**
 * Service function to fetch all orders with verification and transformation.
 *
 * @param {Object} options - Fetch options for the query.
 * @param {number} options.page - The current page number (default: 1).
 * @param {number} options.limit - The number of orders per page (default: 10).
 * @param {string} options.sortBy - The column to sort the results by (default: 'created_at').
 * @param {string} options.sortOrder - The order of sorting ('ASC' or 'DESC', default: 'DESC').
 * @param {boolean} options.verifyOrderNumbers - Whether to verify order numbers using checksum (default: true).
 * @returns {Promise<Object>} - The paginated orders result with transformed data.
 */
const fetchAllOrdersService = async ({
                                       page = 1,
                                       limit = 10,
                                       sortBy = 'created_at',
                                       sortOrder = 'DESC',
                                       verifyOrderNumbers = true
                                     } = {}) => {
  try {
    // Fetching raw order data from repository
    const result = await getAllOrders({ page, limit, sortBy, sortOrder });
    
    // Transform the data
    result.data = transformOrders(result.data, verifyOrderNumbers);
    
    return result;
  } catch (error) {
    logError('Error fetching all orders:', error);
    throw AppError.databaseError('Failed to fetch all orders');
  }
};

module.exports = {
  createOrderByType,
  fetchOrderDetails,
  fetchAllOrdersService,
};
