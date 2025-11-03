/**
 * Defines all supported order categories used throughout the application.
 *
 * These categories group order types for use in:
 * - Navigation and routing (e.g., `/orders/sales`)
 * - Filtering in UI and queries
 * - Access control and permission evaluation
 *
 * Special categories:
 * - `'all'`: A virtual category used to query across all order types.
 *   Requires elevated permissions (e.g., root or admin access).
 * - `'allocatable'`: A virtual category representing any order
 *   currently in an allocatable state (e.g., confirmed or allocating).
 *   Often used for filtering or processing inventory allocation logic.
 *
 * Both virtual categories (`'all'`, `'allocatable'`) must be handled explicitly
 *     in backend logic, as they do not directly map to physical order type records.
 */
const ORDER_CATEGORIES = [
  'sales',
  'purchase',
  'transfer',
  'return',
  'manufacturing',
  'logistics',
  'adjustment',
  'all', // Virtual category for cross-category access
  'allocatable', // Virtual category for allocation-stage filtering
];

/**
 * Supported order actions used for generating permission keys/values.
 * These should align with both frontend constants and backend permission definitions.
 *
 * @type {string[]}
 */
const ORDER_ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];

/**
 * Builds the constant-style key for a given action + category combination.
 *
 * Example:
 *   toConstKey('CREATE', 'sales') -> 'CREATE_SALES_ORDER'
 *
 * @param {string} action - One of ORDER_ACTIONS (e.g., 'CREATE', 'VIEW').
 * @param {string} cat    - Order category in lowercase (e.g., 'sales', 'purchase').
 * @returns {string} Constant key string.
 */
const toConstKey = (action, cat) => `${action}_${cat.toUpperCase()}_ORDER`;

/**
 * Builds the stored permission value (snake_case) for a given order action + category.
 *
 * Examples:
 *   toPermissionValue('VIEW', 'sales')       -> 'view_sales_order'
 *   toPermissionValue('CREATE', 'purchase')  -> 'create_purchase_order'
 *   toPermissionValue('UPDATE', 'transfer')  -> 'update_transfer_order'
 *
 * @param {string} action   - One of ORDER_ACTIONS (e.g., 'VIEW', 'CREATE').
 * @param {string} category - Order category in lowercase (e.g., 'sales', 'purchase').
 * @returns {string} Snake_case permission string.
 */
const toPermissionValue = (action, category) =>
  `${action.toLowerCase()}_${category}_order`;

/**
 * Mapping of generated constant keys to their corresponding stored permission values.
 *
 * Example entry:
 *   {
 *     CREATE_SALES_ORDER: 'create_sales_order',
 *     VIEW_PURCHASE_ORDER: 'view_purchase_order'
 *   }
 *
 * Generated dynamically from ORDER_ACTIONS × ORDER_CATEGORIES.
 *
 * @type {Record<string, string>}
 */
const CATEGORY_PERMISSIONS = Object.fromEntries(
  ORDER_ACTIONS.flatMap((action) =>
    ORDER_CATEGORIES.map((cat) => [
      toConstKey(action, cat),
      toPermissionValue(action, cat),
    ])
  )
);

/**
 * Generic order-level permissions (not tied to a specific category).
 * These are useful for broad access control rules, such as:
 *   - View all orders regardless of category
 *   - Create any order without category restriction
 *
 * @type {Record<string, string>}
 */
const GENERIC_ORDER_PERMISSIONS = {
  ORDER_VIEW: 'view_order',
  ORDER_CREATE: 'create_order',
  ORDER_UPDATE: 'update_order',
  ORDER_DELETE: 'delete_order',
};

/**
 * Consolidated permission map combining:
 *   - Generic order permissions
 *   - Category-specific permissions
 *
 * Example:
 *   {
 *     ORDER_VIEW: 'view_order',
 *     CREATE_SALES_ORDER: 'create_sales_order',
 *     VIEW_PURCHASE_ORDER: 'view_purchase_order',
 *     ...
 *   }
 *
 * @type {Record<string, string>}
 */
const PERMISSIONS = {
  ...GENERIC_ORDER_PERMISSIONS,
  ...CATEGORY_PERMISSIONS,
};

/**
 * Specialized order type constants for permissions related to order type
 * metadata or advanced filtering capabilities.
 *
 * @type {{ PERMISSIONS: Record<string, string> }}
 */
const ORDER_TYPE_CONSTANTS = {
  PERMISSIONS: {
    /** Permission to view the internal code for an order type */
    VIEW_ORDER_TYPE_CODE: 'view_order_type_code',
    /** Permission to view all statuses associated with an order type */
    VIEW_ALL_ORDER_TYPE_STATUSES: 'view_all_order_type_statuses',
  },
};

module.exports = {
  ORDER_CATEGORIES,
  GENERIC_ORDER_PERMISSIONS,
  PERMISSIONS,
  ORDER_TYPE_CONSTANTS,
  toPermissionValue,
};
