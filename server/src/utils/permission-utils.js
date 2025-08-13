const {
  ORDER_CATEGORIES,
  toPermissionValue,
} = require('./constants/domain/order-type-constants');

/**
 * Derive the list of order categories a user can access for a given action.
 *
 * Uses snake_case permission values like:
 *   - Generic:  "view_order", "create_order", ...
 *   - Specific: "view_sales_order", "create_purchase_order", ...
 *
 * If the user has the generic permission for the action (e.g., "view_order"),
 * all categories are allowed.
 *
 * @param {string[]} permissions - Permission codes assigned to the user.
 * @param {{ action?: 'VIEW'|'CREATE'|'UPDATE'|'DELETE' }} [opts]
 *   action: which permission action to check (default 'VIEW')
 * @returns {string[]} Array of category codes the user can access.
 */
const getAccessibleOrderCategoriesFromPermissions = (
  permissions = [],
  { action = 'VIEW' } = {}
) => {
  if (!Array.isArray(permissions)) return [];
  
  // Normalize and precompute lookups
  const permSet = new Set(permissions);
  const actionLower = action.toLowerCase();
  
  // Generic allow (e.g., "view_order") grants all categories
  const genericKey = `${actionLower}_order`;
  if (permSet.has(genericKey)) {
    return [...ORDER_CATEGORIES];
  }
  
  // Match only specific action permission like 'create_sales_order'
  return ORDER_CATEGORIES.filter((category) =>
    permSet.has(toPermissionValue(action, category))
  );
};

module.exports = {
  getAccessibleOrderCategoriesFromPermissions,
};
