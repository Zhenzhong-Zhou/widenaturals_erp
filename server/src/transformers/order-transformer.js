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
  return {
    order_id: baseOrder.order_id,
    order_number: baseOrder.order_number,
    order_category: baseOrder.order_category ?? '',
    order_type: baseOrder.order_type ?? '',
    order_date: baseOrder.order_date,
    customer_name: baseOrder.customer_name ?? '',
    order_status: baseOrder.order_status ?? 'Unknown',
    discount_type: baseOrder.discount_type ?? null,
    discount_value: baseOrder.discount_value ?? null,
    subtotal: baseOrder.subtotal ?? '0.00',
    tax_rate: baseOrder.tax_rate ?? '0.00',
    tax_amount: baseOrder.tax_amount ?? '0.00',
    shipping_fee: baseOrder.shipping_fee ?? '0.00',
    total_amount: baseOrder.total_amount ?? '0.00',
    order_note: baseOrder.order_note || '',  // Ensure it's an empty string if null
    order_metadata: baseOrder.order_metadata || {},  // Ensure it's an empty object if null
    items: orderDetails.map(order => ({
      order_item_id: order.order_item_id,
      product_id: order.product_id,
      product_name: order.product_name ?? '',
      barcode: order.barcode ?? '',
      npn: order.npn ?? '',
      quantity_ordered: order.quantity_ordered ?? 0,
      price_type: order.price_type ?? 'Unknown',
      system_price: order.system_price ?? null,
      adjusted_price: order.adjusted_price ?? null,
      order_item_status: order.order_item_status ?? 'Unknown',
    })),
  };
}

module.exports = {
  transformAllOrders,
  transformOrderDetails
};
