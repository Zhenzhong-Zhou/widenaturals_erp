/**
 * Defines all supported order categories used across the application.
 *
 * These categories determine the functional grouping of order types for routing,
 * filtering, and access control.
 *
 * Includes a special category `'all'` used to fetch all orders across categories.
 * This virtual category is only available to privileged users (e.g., root/admin)
 * and must be handled explicitly in backend logic and permission checks.
 */
const ORDER_CATEGORIES = [
  'sales',
  'purchase',
  'transfer',
  'return',
  'manufacturing',
  'logistics',
  'adjustment',
  'all' // Virtual category for high-level access
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
  ORDER_ACTIONS.flatMap(action =>
    ORDER_CATEGORIES.map(cat => [
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
