/**
 * Defines all supported order categories used across the application.
 * These categories determine the functional grouping of order types.
 *
 * Used to generate permissions and mappings dynamically.
 */
const ORDER_CATEGORIES = [
  'sales',
  'purchase',
  'transfer',
  'return',
  'manufacturing',
  'logistics',
  'adjustment',
];

/**
 * Dynamically generates permission constants based on order categories.
 *
 * Example:
 *   PERMISSIONS.CREATE_SALES_ORDER => 'create_sales_order'
 *   PERMISSIONS.CREATE_TRANSFER_ORDER => 'create_transfer_order'
 *
 * This avoids manual duplication and ensures consistency.
 */
const PERMISSIONS = Object.fromEntries(
  ORDER_CATEGORIES.map((cat) => [
    `CREATE_${cat.toUpperCase()}_ORDER`,
    `create_${cat}_order`,
  ])
);

/**
 * Maps each order category to its corresponding permission value.
 *
 * This map allows checking access by category.
 * Useful when determining whether a user has permission to create a specific type of order.
 *
 * Example:
 *   CATEGORY_PERMISSION_MAP['sales'] => 'create_sales_order'
 */
const CATEGORY_PERMISSION_MAP = {
  sales: PERMISSIONS.CREATE_SALES_ORDER,
  return: PERMISSIONS.CREATE_RETURN_ORDER,
  transfer: PERMISSIONS.CREATE_TRANSFER_ORDER,
  purchase: PERMISSIONS.CREATE_PURCHASE_ORDER,
  manufacturing: PERMISSIONS.CREATE_MANUFACTURING_ORDER,
  logistics: PERMISSIONS.CREATE_LOGISTICS_ORDER,
  adjustment: PERMISSIONS.CREATE_ADJUSTMENT_ORDER,
};

module.exports = {
  ORDER_CATEGORIES,
  PERMISSIONS,
  CATEGORY_PERMISSION_MAP,
};
