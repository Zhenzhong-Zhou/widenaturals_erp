/**
 * Defines all supported order categories used across the application.
 * These categories determine the functional grouping of order types.
 *
 * Used to generate permissions and mappings dynamically.
 */
export const ORDER_CATEGORIES = [
  'sales',
  'purchase',
  'transfer',
  'return',
  'manufacturing',
  'logistics',
  'adjustment',
] as const;

export type OrderCategory = (typeof ORDER_CATEGORIES)[number];

/**
 * Dynamically generates permission constants based on order categories.
 *
 * Example:
 *   PERMISSIONS.CREATE_SALES_ORDER => 'create_sales_order'
 *   PERMISSIONS.CREATE_TRANSFER_ORDER => 'create_transfer_order'
 *
 * This avoids manual duplication and ensures consistency.
 */
export const PERMISSIONS = Object.fromEntries(
  ORDER_CATEGORIES.map((cat) => [
    `CREATE_${cat.toUpperCase()}_ORDER`,
    `create_${cat}_order`,
  ])
) as Record<`CREATE_${Uppercase<OrderCategory>}_ORDER`, `create_${OrderCategory}_order`>;

/**
 * Maps each order category to its corresponding permission value.
 *
 * This map allows checking access by category.
 * Useful when determining whether a user has permission to create a specific type of order.
 *
 * Example:
 *   CATEGORY_PERMISSION_MAP['sales'] => 'create_sales_order'
 */
export const CATEGORY_PERMISSION_MAP: Record<OrderCategory, string> = Object.fromEntries(
  ORDER_CATEGORIES.map((cat) => [cat, `create_${cat}_order`])
) as Record<OrderCategory, string>;
