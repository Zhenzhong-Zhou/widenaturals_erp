const { formatDiscount } = require('../utils/string-utils');
const { checkPermissions } = require('../services/role-permission-service');
const { verifyOrderNumber } = require('../utils/order-number-utils');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { updateOrderAndItemStatus, getOrderAndItemStatusCodes } = require('../repositories/order-repository');
const { transformOrderStatusCodes } = require('../transformers/order-transformer');

/**
 * Validates a list of orders by their order numbers.
 *
 * @param {Array} orders - The list of transformed orders to validate.
 * @param {boolean} verifyOrderNumbers - Whether to verify order numbers.
 * @returns {Array} - Orders with `order_number_valid` property included.
 */
const validateOrderNumbers = (orders, verifyOrderNumbers = true) => {
  if (!Array.isArray(orders)) return [];
  
  return orders.map(order => {
    let isOrderNumberValid = true;
    
    if (verifyOrderNumbers) {
      isOrderNumberValid = verifyOrderNumber(order.order_number);
      
      if (!isOrderNumberValid) {
        logError(`Invalid order number detected: ${order.order_number}`);
      }
    }
    
    return {
      ...order,
      order_number_valid: isOrderNumberValid
    };
  });
};

/**
 * Applies business logic to the transformed order data.
 * @param {object} order - The transformed order object.
 * @param {object} user - The user object containing permissions.
 * @returns {object} - Order object with applied business logic.
 */
const applyOrderDetailsBusinessLogic = async (order, user) => {
  // Check if the order number is valid
  const isOrderNumberValid = verifyOrderNumber(order.order_number);
  
  if (!isOrderNumberValid) {
    // Check if the user has permission to view invalid orders
    const canViewInvalidOrder = await checkPermissions(user, [
      'root_access',
      'view_full_sales_order_details',
      'view_all_order_details'
    ]);
    
    if (!canViewInvalidOrder) {
      throw AppError.validationError('Order number is invalid or not found.');
    }
  }
  
  // Format the discount and remove the original discount_type and discount_value
  order.discount = formatDiscount(order.discount_type, order.discount_value);
  delete order.discount_type;
  delete order.discount_value;
  
  // Process each item
  order.items = order.items.map(item => {
    // Prepare the transformed item
    const transformedItem = {
      ...item,
      system_price: item.system_price,
    };
    
    // Remove adjusted_price if it's the same as system_price or null
    if (item.adjusted_price === null || item.adjusted_price === item.system_price) {
      delete transformedItem.adjusted_price;
    } else {
      transformedItem.adjusted_price = item.adjusted_price;
    }
    
    return transformedItem;
  });
  
  // Check if the user has permission to view metadata and category
  const canViewMetadata = checkPermissions(user, [
    'root_access',
    'view_all_order_details',
    'view_full_sales_order_details',
  ]);
  
  // Remove sensitive data if the user lacks permission
  if (!canViewMetadata) {
    delete order.order_category;
    delete order.order_metadata;
  }
  
  return order;
};

/**
 * Business logic to confirm an order and its items.
 *
 * @param {string} orderId - The UUID of the order to confirm.
 * @param {object} user - Authenticated user object (must contain role).
 * @param {object} client - Optional PostgreSQL client (for transaction support).
 * @returns {Promise<Object>} Raw confirmation result.
 */
const confirmOrderWithItems = async (orderId, user, client) => {
  const hasPermission = await checkPermissions(user, [
    'root_access',
    'confirm_order',
    'confirm_sales_order'
  ]);
  
  if (!hasPermission) {
    throw AppError.authorizationError('You do not have permission to confirm orders.');
  }
  
  return await updateOrderAndItemStatus(orderId, 'ORDER_CONFIRMED', client);
};

/**
 * Determines whether an order can be confirmed by validating both
 * the current order status and all associated order item statuses.
 *
 * Confirmation is allowed only if:
 * - The order's status code is in the allowed list (e.g., 'ORDER_PENDING')
 * - All order items also have a status that permits confirmation
 *
 * @param {string} orderId - UUID of the order to check
 * @param {object} client - Optional database client for transaction context
 * @returns {Promise<boolean>} - Whether the order is eligible for confirmation
 * @throws {AppError} - If the order status cannot be retrieved
 */
const canConfirmOrder = async (orderId, client) => {
  const allowedStatusCodes = ['ORDER_PENDING', 'ORDER_EDITED'];
  const allowedItemStatuses = ['ORDER_PENDING', 'ORDER_EDITED'];
  
  const rawStatusRows = await getOrderAndItemStatusCodes(orderId, client);
  const { order_status_code, item_status_codes } = transformOrderStatusCodes(rawStatusRows);
  
  if (!order_status_code) {
    throw AppError.databaseError(`Order status not found for order ID: ${orderId}`);
  }
  
  const isOrderConfirmable = allowedStatusCodes.includes(order_status_code);
  const areAllItemsConfirmable = item_status_codes.every((status) =>
    allowedItemStatuses.includes(status)
  );
  
  return isOrderConfirmable && areAllItemsConfirmable;
};

module.exports = {
  validateOrderNumbers,
  applyOrderDetailsBusinessLogic,
  confirmOrderWithItems,
  canConfirmOrder,
};
