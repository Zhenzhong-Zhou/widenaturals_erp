/**
 * @file order-access-utils.js
 * @description Pure utility for resolving which order categories a user can
 * access based on their permission set. Handles both generic order permissions
 * and category-specific permissions, including virtual categories such as
 * `'allocatable'`.
 */

'use strict';

const {
  ORDER_CATEGORIES,
  toPermissionValue,
} = require('./constants/domain/order-type-constants');
const { PERMISSIONS } = require('./constants/domain/order-constants');

/**
 * Resolves the list of order categories accessible to a user for a given action,
 * derived entirely from their flat permissions array.
 *
 * A generic permission (e.g. `'view_order'`) grants access to all standard
 * categories. Otherwise only categories with a matching specific permission
 * (e.g. `'view_order_draft'`) are included.
 *
 * The virtual category `'allocatable'` is appended when the user holds any
 * stage-level view permission (`view_allocation_stage`, `view_fulfillment_stage`,
 * or `view_shipping_stage`) and the action is `'view'`.
 *
 * @param {string[]} [permissions=[]] - Flat array of permission strings for the user.
 * @param {object} [options={}]
 * @param {string} [options.action='VIEW'] - The action to resolve categories for (e.g. `'VIEW'`, `'EDIT'`).
 * @returns {string[]} Array of accessible order category strings.
 */
const getAccessibleOrderCategoriesFromPermissions = (
  permissions = [],
  { action = 'VIEW' } = {}
) => {
  if (!Array.isArray(permissions)) return [];

  const permSet = new Set(permissions);
  const actionLower = action.toLowerCase();

  // Generic permission (e.g. 'view_order') grants access to all standard categories.
  const genericKey = `${actionLower}_order`;
  const accessible = permSet.has(genericKey)
    ? [...ORDER_CATEGORIES]
    : ORDER_CATEGORIES.filter((category) =>
        permSet.has(toPermissionValue(action, category))
      );

  // 'allocatable' is a virtual category — not in ORDER_CATEGORIES, appended
  // only when the user can view at least one fulfillment stage.
  if (
    actionLower === 'view' &&
    (permSet.has(PERMISSIONS.VIEW_ALLOCATION_STAGE) ||
      permSet.has(PERMISSIONS.VIEW_FULFILLMENT_STAGE) ||
      permSet.has(PERMISSIONS.VIEW_SHIPPING_STAGE))
  ) {
    accessible.push('allocatable');
  }

  return accessible;
};

module.exports = {
  getAccessibleOrderCategoriesFromPermissions,
};
