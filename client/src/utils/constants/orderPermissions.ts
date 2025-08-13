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

/** Union type of all supported order categories. */
export type OrderCategory = (typeof ORDER_CATEGORIES)[number];

/**
 * Defines all supported order actions for RBAC (Role-Based Access Control).
 *
 * These actions, when combined with categories, form the basis of our
 * permission keys and values.
 *
 * Examples:
 *  - 'VIEW'
 *  - 'CREATE'
 *  - 'UPDATE'
 *  - 'DELETE'
 */
export const ORDER_ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'] as const;

/** Union type of all supported order actions. */
export type OrderAction = (typeof ORDER_ACTIONS)[number];

/**
 * Builds the stored permission value (snake_case) for a given
 * order action + category combination.
 *
 * Examples:
 *   toPermissionValue('VIEW', 'sales')        // 'view_sales_order'
 *   toPermissionValue('CREATE', 'purchase')   // 'create_purchase_order'
 *   toPermissionValue('UPDATE', 'transfer')   // 'update_transfer_order'
 *
 * @param action   One of the supported order actions.
 * @param category One of the supported order categories.
 * @returns The permission value string in snake_case.
 */
export const toPermissionValue = (action: OrderAction, category: OrderCategory) =>
  `${action.toLowerCase()}_${category}_order`;

/**
 * Dynamically generates a complete permission map for all
 * combinations of actions and categories.
 *
 * The keys are constant-style uppercase (e.g., `CREATE_SALES_ORDER`),
 * and the values are the stored permission strings in snake_case
 * (e.g., `create_sales_order`).
 *
 * This structure ensures:
 *  - No manual duplication
 *  - Strong type safety via mapped types
 *  - Automatic updates when actions or categories are added
 *
 * Example:
 *   PERMISSIONS.CREATE_SALES_ORDER  // 'create_sales_order'
 *   PERMISSIONS.VIEW_PURCHASE_ORDER // 'view_purchase_order'
 */
export const PERMISSIONS = Object.fromEntries(
  ORDER_ACTIONS.flatMap((action) =>
    ORDER_CATEGORIES.map((cat) => [
      `${action}_${cat.toUpperCase()}_ORDER`,
      toPermissionValue(action, cat),
    ])
  )
) as {
  [K in `${OrderAction}_${Uppercase<OrderCategory>}_ORDER`]:
  `${Lowercase<OrderAction>}_${OrderCategory}_order`;
};
