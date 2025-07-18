const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Enforces access control for viewing payment methods.
 * - If the user lacks `view_payment_code`, they cannot filter or search by `code`.
 * - Always restrict to active methods unless permission `view_all_payment_methods` is granted.
 *
 * @param {Object} user - The current user object
 * @param {Object} filters - The original filters passed to the API
 * @returns {Object} - Sanitized filters based on access level
 *
 * Returned filters may include:
 * - `isActive: true` if the user lacks elevated permission.
 * - `_restrictKeywordToNameOnly: true` — internal flag that instructs the filter builder
 *   to restrict keyword matching to `name` only (not `code`, `description`, etc.).
 *
 * @throws {AppError} - If unauthorized filtering is attempted (e.g., by `code`)
 */
const enforcePaymentMethodAccessControl = async (user, filters = {}) => {
  const adjustedFilters = { ...filters };

  try {
    // Fetch all permissions once
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const has = (perm) => isRoot || permissions.includes(perm); // respect allowRootAccess

    // 1. Enforce isActive if user lacks elevated permission
    if (!has('view_all_payment_methods')) {
      adjustedFilters.isActive = true;
    } else {
      delete adjustedFilters.isActive;
    }

    // 2. Restrict keyword scope if lacking permission
    if (!has('view_payment_code') && 'keyword' in adjustedFilters) {
      const keyword = adjustedFilters.keyword.trim();

      if (/^[A-Z0-9_]+$/.test(keyword)) {
        logSystemException(
          new Error('Unauthorized code-based keyword search'),
          'Blocked keyword search by code without permission',
          {
            context:
              'payment-method-business/enforcePaymentMethodAccessControl',
            userId: user.id,
            keyword,
          }
        );
        throw AppError.authorizationError('Filtering by code is not allowed.');
      }

      adjustedFilters._restrictKeywordToNameOnly = true;
    }

    return adjustedFilters;
  } catch (err) {
    logSystemException(
      err,
      'Access control check failed for payment method lookup',
      {
        context: 'payment-method-business/enforcePaymentMethodAccessControl',
        filters,
        userId: user.id,
      }
    );
    throw AppError.businessError(
      'Failed to enforce access control for payment method lookup.'
    );
  }
};

module.exports = {
  enforcePaymentMethodAccessControl,
};
