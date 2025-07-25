const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const { PERMISSIONS } = require('../utils/constants/domain/payment-method-constants');

/**
 * Evaluates the access permissions of a user for payment method lookup operations.
 *
 * This function checks whether the user has elevated permissions to:
 * - View all payment method statuses (active and inactive)
 * - Perform keyword searches that include the `code` field
 *
 * It is used to guide backend filtering logic and restrict unauthorized queries.
 *
 * @param {Object} user  - The authenticated user object (must include `id` and permission context).
 * @returns {Promise<{
 *   canViewAllStatuses: boolean;
 *   canViewPaymentCode: boolean;
 * }>} Resolves access rights for the current user.
 * @throws {AppError} When permission evaluation fails due to unexpected conditions or user context issues.
 */
const evaluatePaymentMethodLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses: isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PAYMENT_METHOD_STATUSES),
      canViewPaymentCode: isRoot || permissions.includes(PERMISSIONS.VIEW_PAYMENT_CODE),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate payment method access control', {
      context: 'payment-method-business/evaluatePaymentMethodLookupAccessControl',
      userId: user?.id,
    });
    
    throw AppError.businessError('Unable to evaluate access control for payment method lookup', {
      details: err.message,
      stage: 'evaluate-payment-method-access',
    });
  }
};

/**
 * Enforces visibility restrictions on payment method lookup filters
 * based on the user's access permissions.
 *
 * - If the user cannot view all statuses, enforces filtering to active-only
 * - If the user cannot search by `code`, restricts keyword searches to the `name` field
 *   and throws an error if a code-like keyword is detected (e.g., uppercase or underscores)
 *
 * @param {Object} filters - The original query filters from the client.
 * @param {{
 *   canViewAllStatuses: boolean;
 *   canViewPaymentCode: boolean;
 * }} userAccess - The evaluated access control flags for the user.
 * @returns {Object} Adjusted filters with enforced access constraints.
 * @throws {AppError} If a code-based keyword search is attempted without permission.
 */
const enforcePaymentMethodLookupVisibilityRules = (filters = {}, userAccess) => {
  const adjusted = { ...filters };
  
  // Enforce active-only restriction
  if (!userAccess.canViewAllStatuses) {
    adjusted.isActive = true;
  } else {
    delete adjusted.isActive;
  }
  
  // Restrict keyword filtering to name only
  if (!userAccess.canViewPaymentCode && adjusted.keyword) {
    const keyword = adjusted.keyword.trim();
    
    // Defensive check: block attempts to match a code format
    if (/^[A-Z0-9_]+$/.test(keyword)) {
      logSystemException(
        new Error('Unauthorized code-based keyword search'),
        'Blocked keyword search by code without permission',
        {
          context: 'payment-method-business/enforcePaymentMethodLookupVisibilityRules',
          keyword,
        }
      );
      
      throw AppError.authorizationError('Filtering by code is not allowed.');
    }
    
    adjusted._restrictKeywordToNameOnly = true;
  }
  
  return adjusted;
};

/**
 * Enriches a payment method row with a UI-friendly `isDisabled` flag.
 *
 * This utility is typically used to mark inactive options for UI components
 * (e.g., disabling them in dropdowns). It does not modify the original structure
 * beyond adding a derived `isDisabled` boolean.
 *
 * @param {Object} row - The raw payment method row, must include `is_active` field.
 * @returns {Object} Enriched payment method row with an `isDisabled` flag.
 *
 * @example
 * const enriched = enrichPaymentMethodOption({ id: '123', name: 'Credit Card', is_active: false });
 * // => { id: '123', name: 'Credit Card', is_active: false, isDisabled: true }
 */
const enrichPaymentMethodOption = (row) => {
  return {
    ...row,
    isActive: row.is_active,
  };
};

module.exports = {
  evaluatePaymentMethodLookupAccessControl,
  enforcePaymentMethodLookupVisibilityRules,
  enrichPaymentMethodOption,
};
