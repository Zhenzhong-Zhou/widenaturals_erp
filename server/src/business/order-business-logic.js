const { formatDiscount } = require('../utils/string-utils');
const { checkPermissions } = require('../services/role-permission-service');
const { verifyOrderNumber } = require('../utils/order-number-utils');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

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
const applyOrderDetailsBusinessLogic = (order, user) => {
  // Check if the order number is valid
  const isOrderNumberValid = verifyOrderNumber(order.order_number);
  
  if (!isOrderNumberValid) {
    // Check if the user has permission to view invalid orders
    const canViewInvalidOrder = checkPermissions(user, [
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
    'view_all_order_details'
  ]);
  
  // Remove sensitive data if the user lacks permission
  if (!canViewMetadata) {
    delete order.order_category;
    delete order.order_metadata;
  }
  
  return order;
};

/**
 * Determines which price to display based on the comparison of system price and adjusted price.
 * @param {number|null} systemPrice - The price from the pricing table.
 * @param {number|null} adjustedPrice - The manually adjusted price from the order items table.
 * @returns {object} - Formatted price information.
 */
const determineDisplayPrice = (systemPrice, adjustedPrice) => {
  if (adjustedPrice === null || systemPrice === adjustedPrice) {
    return { price: systemPrice, type: 'System Price' };
  }
  
  return {
    system_price: { price: systemPrice, type: 'System Price' },
    adjusted_price: { price: adjustedPrice, type: 'Adjusted Price' }
  };
};

module.exports = {
  validateOrderNumbers,
  applyOrderDetailsBusinessLogic
};
