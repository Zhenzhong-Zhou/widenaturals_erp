const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemError } = require('../utils/system-logger');
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
 * Enriches a payment method row with a UI-friendly `isActive` flag.
 *
 * - Converts the raw `is_active` field (from DB) into a normalized boolean `isActive`.
 * - Preserves all original fields for downstream use.
 * - Throws a client-safe error if the row is invalid, while logging developer diagnostics.
 *
 * Useful when transforming database records for dropdowns or other UI
 * components that require a consistent `isActive` property.
 *
 * @param {object} row - Raw payment method row (must include `is_active` field).
 * @returns {object} Enriched payment method row with an `isActive` boolean.
 *
 * @throws {AppError} ValidationError if the row is invalid.
 *
 * @example
 * const enriched = enrichPaymentMethodOption({
 *   id: '123',
 *   name: 'Credit Card',
 *   is_active: false
 * });
 * // => { id: '123', name: 'Credit Card', is_active: false, isActive: false }
 */
const enrichPaymentMethodOption = (row) => {
  if (!row || typeof row !== 'object') {
    // Log detailed error for devs
    logSystemError('[enrichPaymentMethodOption] Invalid row type', {
      gotType: typeof row,
      row,
    });
    
    // Throw sanitized error for client
    throw AppError.validationError('Invalid payment method data received.');
  }
  
  return {
    ...row,
    isActive: row.is_active === true,
  };
};

module.exports = {
  evaluatePaymentMethodLookupAccessControl,
  enforcePaymentMethodLookupVisibilityRules,
  enrichPaymentMethodOption,
};
