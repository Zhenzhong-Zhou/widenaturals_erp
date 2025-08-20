const ORDER_STATUSES = [
  { name: 'Pending', code: 'ORDER_PENDING', category: 'draft' },
  { name: 'Edited', code: 'ORDER_EDITED', category: 'draft' },
  { name: 'Awaiting Review', code: 'ORDER_AWAITING_REVIEW', category: 'confirmation' },
  { name: 'Confirmed', code: 'ORDER_CONFIRMED', category: 'confirmation' },
  { name: 'Allocating', code: 'ORDER_ALLOCATING', category: 'processing' },
  { name: 'Partially Allocated', code: 'ORDER_PARTIALLY_ALLOCATED', category: 'processing' },
  { name: 'Fully Allocated', code: 'ORDER_ALLOCATED', category: 'processing' },
  { name: 'Backordered', code: 'ORDER_BACKORDERED', category: 'processing' },
  { name: 'Processing', code: 'ORDER_PROCESSING', category: 'processing' },
  { name: 'Partially Fulfilled', code: 'ORDER_PARTIALLY_FULFILLED', category: 'processing' },
  { name: 'Shipped', code: 'ORDER_SHIPPED', category: 'processing' },
  { name: 'Out for Delivery', code: 'ORDER_OUT_FOR_DELIVERY', category: 'processing' },
  { name: 'Fulfilled', code: 'ORDER_FULFILLED', category: 'completion' },
  { name: 'Delivered', code: 'ORDER_DELIVERED', category: 'completion' },
  { name: 'Canceled', code: 'ORDER_CANCELED', category: 'completion' },
  { name: 'Return Requested', code: 'RETURN_REQUESTED', category: 'return' },
  { name: 'Returned', code: 'RETURN_COMPLETED', category: 'return' },
];

const ORDER_STATUS_CODES = ORDER_STATUSES.map(s => s.code);
const ORDER_STATUS_BY_CODE = Object.fromEntries(ORDER_STATUSES.map(s => [s.code, s]));
const ORDER_STATUS_CATEGORIES = [...new Set(ORDER_STATUSES.map(s => s.category))];

module.exports = {
  ORDER_STATUSES,
  ORDER_STATUS_CODES,
  ORDER_STATUS_BY_CODE,
  ORDER_STATUS_CATEGORIES,
};
