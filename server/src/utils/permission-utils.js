const {
  ORDER_CATEGORIES,
  CATEGORY_PERMISSION_MAP
} = require('./constants/domain/order-type-constants');

/**
 * Derives the list of order categories a user is allowed to access based on their permissions.
 *
 * @param {string[]} permissions - List of permission codes assigned to the user.
 * @returns {string[]} Array of order category codes the user has access to.
 */
const getAccessibleOrderCategoriesFromPermissions = (permissions = []) => {
  return ORDER_CATEGORIES.filter((category) =>
    permissions.includes(CATEGORY_PERMISSION_MAP[category])
  );
};

module.exports = {
  getAccessibleOrderCategoriesFromPermissions,
};
