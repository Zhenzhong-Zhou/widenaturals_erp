/**
 * Transforms raw order data into a structured format.
 *
 * @param {Array} rawData - Raw order data fetched from the repository.
 * @returns {Array} - Transformed order data.
 */
const transformAllOrders = (rawData) => {
  if (!Array.isArray(rawData)) return [];
  
  return rawData.map(order => ({
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
    updated_by: order.updated_by || null
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
  const isSameOrderDate = new Date(baseOrder.order_date).getTime() === new Date(baseOrder.sales_order_date).getTime();
  const orderDate = isSameOrderDate ? baseOrder.order_date : {
    order_date: baseOrder.order_date,
    sales_order_date: baseOrder.sales_order_date
  };
  
  // Determine if tracking info should be displayed (only if not In-Store Pickup)
  const trackingInfo = !baseOrder.is_pickup_location && baseOrder.tracking_number
    ? {
      tracking_number: baseOrder.tracking_number,
      carrier: baseOrder.carrier,
      service_name: baseOrder.service_name,
      shipped_date: baseOrder.shipped_date,
    }
    : null;
  
  // Process items
  const items = orderDetails.map(order => {
    const hasValidSystemPrice = typeof order.system_price === 'string' && order.system_price.trim() !== '';
    const hasValidAdjustedPrice = typeof order.adjusted_price === 'string' && order.adjusted_price.trim() !== '';
    
    return {
      order_item_id: order.order_item_id,
      product_id: order.product_id,
      product_name: order.product_name ?? 'N/A',
      barcode: order.barcode ?? 'N/A',
      npn: order.npn ?? 'N/A',
      quantity_ordered: order.quantity_ordered ?? 0,
      price_type: order.price_type ?? 'Unknown',
      system_price: hasValidSystemPrice ? order.system_price : 'N/A',
      adjusted_price: hasValidAdjustedPrice && order.system_price !== order.adjusted_price ? order.adjusted_price : null,
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
    order_date: orderDate,  // Processed order date
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
    items,
  };
};

module.exports = {
  transformAllOrders,
  transformOrderDetails
};
