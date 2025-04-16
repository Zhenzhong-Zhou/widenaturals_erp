const AppError = require('../utils/AppError');
/**
 * Transforms raw order data into a structured format.
 *
 * @param {Array} rawData - Raw order data fetched from the repository.
 * @returns {Array} - Transformed order data.
 */
const transformAllOrders = (rawData) => {
  if (!Array.isArray(rawData)) return [];

  return rawData.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    order_type: order.order_type,
    category: order.category,
    order_date: order.order_date,
    status: order.status,
    note: order.note || '',
    created_at: order.created_at || null,
    updated_at: order.updated_at || null,
    created_by: order.created_by || null,
    updated_by: order.updated_by || null,
  }));
};

/**
 * Transforms raw order data fetched from the repository into a structured format.
 * @param {Array} orderDetails - The raw order data from the repository.
 * @returns {object} - Transformed order object.
 */
const transformOrderDetails = (orderDetails) => {
  if (!orderDetails || orderDetails.length === 0) return null;
  
  const baseOrder = orderDetails[0];

  // Convert date strings to Date objects and compare their timestamps
  const isSameOrderDate =
    new Date(baseOrder.order_date).getTime() ===
    new Date(baseOrder.sales_order_date).getTime();
  const orderDate = isSameOrderDate
    ? baseOrder.order_date
    : {
      order_date: baseOrder.order_date,
      sales_order_date: baseOrder.sales_order_date,
    };
  
  // Determine if tracking info should be displayed (only if not In-Store Pickup)
  const trackingInfo =
    !baseOrder.is_pickup_location && baseOrder.tracking_number
      ? {
        tracking_number: baseOrder.tracking_number,
        carrier: baseOrder.carrier,
        service_name: baseOrder.service_name,
        shipped_date: baseOrder.shipped_date,
      }
      : null;

  // Build shipping info
  const shippingInfo = baseOrder.has_shipping_address
    ? {
      shipping_fullname: baseOrder.shipping_fullname ?? '',
      shipping_phone: baseOrder.shipping_phone ?? '',
      shipping_email: baseOrder.shipping_email ?? '',
      shipping_address_line1: baseOrder.shipping_address_line1 ?? '',
      shipping_address_line2: baseOrder.shipping_address_line2 ?? '',
      shipping_city: baseOrder.shipping_city ?? '',
      shipping_state: baseOrder.shipping_state ?? '',
      shipping_postal_code: baseOrder.shipping_postal_code ?? '',
      shipping_country: baseOrder.shipping_country ?? '',
      shipping_region: baseOrder.shipping_region ?? '',
    }
    : null;

  // Process items
  const items = orderDetails.map((order) => {
    const hasValidSystemPrice =
      typeof order.system_price === 'string' &&
      order.system_price.trim() !== '';
    const hasValidAdjustedPrice =
      typeof order.adjusted_price === 'string' &&
      order.adjusted_price.trim() !== '';
    
    return {
      order_item_id: order.order_item_id,
      inventory_id: order.inventory_id,
      item_name:
        order.inventory_identifier?.trim() ||
        order.product_name?.trim() ||
        'N/A',
      barcode: order.barcode ?? 'N/A',
      npn: order.npn ?? 'N/A',
      quantity_ordered: order.quantity_ordered ?? 0,
      price_type: order.price_type ?? 'Unknown',
      system_price: hasValidSystemPrice ? order.system_price : 'N/A',
      adjusted_price:
        hasValidAdjustedPrice && order.system_price !== order.adjusted_price
          ? order.adjusted_price
          : null,
      order_item_subtotal: order.order_item_subtotal ?? 'N/A',
      order_item_status_name: order.order_item_status_name ?? 'Unknown',
      order_item_status_date: order.order_item_status_date ?? 'N/A',
    };
  });
  
  return {
    order_id: baseOrder.order_id,
    order_number: baseOrder.order_number,
    order_category: baseOrder.order_category ?? '',
    order_type: baseOrder.order_type ?? '',
    order_date: orderDate, // Processed order date
    customer_name: baseOrder.customer_name ?? '',
    order_status: baseOrder.order_status ?? 'Unknown',
    discount_type: baseOrder.discount_type ?? null,
    discount_value: baseOrder.discount_value ?? null,
    discount_amount: baseOrder.discount_amount ?? null,
    subtotal: baseOrder.subtotal ?? '0.00',
    tax_rate: baseOrder.tax_rate ?? '0.00',
    tax_amount: baseOrder.tax_amount ?? '0.00',
    shipping_fee: baseOrder.shipping_fee ?? '0.00',
    total_amount: baseOrder.total_amount ?? '0.00',
    order_note: baseOrder.order_note || '',
    order_metadata: baseOrder.order_metadata || {},
    delivery_info: {
      method: baseOrder.delivery_method ?? '', // Display the method name from the database
      tracking_info: trackingInfo, // Show tracking info only if applicable
    },
    shipping_info: shippingInfo,
    items,
  };
};

/**
 * Transforms raw SQL rows into structured order + item format.
 *
 * @param {Array} rows - Raw rows returned from the SQL query.
 * @returns {{
 *   order_status_id: string,
 *   order_status_name: string,
 *   items: Array<{
 *     product_id: string,
 *     quantity_ordered: number,
 *     order_item_status_id: string,
 *     order_item_status_name: string
 *   }>
 * }} - Transformed order structure with item-level status details.
 */
const transformOrderStatusAndItems = (rows) => {
  if (!rows || rows.length === 0) {
    throw AppError.transformerError('No data found to transform.');
  }

  const { order_status_id, order_status_code } = rows[0];

  const orderItems = rows.map((row) => ({
    order_item_id: row.order_item_id,
    inventory_id: row.inventory_id,
    quantity_ordered: Number(row.quantity_ordered),
    order_item_status_id: row.order_item_status_id,
    order_item_status_code: row.order_item_status_code,
  }));

  return {
    order_status_id,
    order_status_code,
    orderItems,
  };
};

/**
 * Transforms raw rows from the order and order item status code query
 * into a structured object for status validation logic.
 *
 * @param {Array<object>} rows - Raw DB result containing status codes.
 * @returns {{ order_status_code: string, item_status_codes: string[] }}
 *          - Normalized object with order status and an array of item status codes.
 */
const transformOrderStatusCodes = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      order_status_code: null,
      item_status_codes: [],
    };
  }

  const order_status_code = rows[0].order_status_code;
  const item_status_codes = rows.map((row) => row.order_item_status_code);

  return {
    order_status_code,
    item_status_codes,
  };
};

/**
 * Transforms the result returned from `updateOrderAndItemStatus`.
 *
 * Normalizes the DB update results into a consistent structure that tracks
 * how many records were updated for both the order and its items.
 *
 * @param {Object} result - Raw result returned from updateOrderAndItemStatus.
 * @param {Object} result.orderResult - Result from updating the order.
 * @param {Object} result.orderItemResult - Result from updating order items.
 * @returns {{
 *   updatedOrderCount: number,
 *   updatedItemCount: number
 * }}
 */
const transformUpdatedOrderStatusResult = ({
  orderResult,
  orderItemResult,
}) => {
  const orderId = orderResult?.rows?.[0]?.id || null;

  return {
    ...(orderId && { orderId }), // only include if available
    updatedOrderCount: orderResult?.rowCount || 0,
    updatedItemCount: orderItemResult?.rowCount || 0,
  };
};

module.exports = {
  transformAllOrders,
  transformOrderDetails,
  transformOrderStatusAndItems,
  transformOrderStatusCodes,
  transformUpdatedOrderStatusResult,
};
