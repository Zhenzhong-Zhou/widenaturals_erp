/**
 * @file payment-method-business.js
 * @description Domain business logic for payment method access control
 * evaluation, visibility rule application, and lookup row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/logging/system-logger');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/payment-method-constants');

const CONTEXT = 'payment-method-business';

/**
 * Resolves which payment method lookup visibility capabilities the requesting
 * user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<PaymentMethodLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluatePaymentMethodLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluatePaymentMethodLookupAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses:
        isRoot ||
        permissions.includes(PERMISSIONS.VIEW_ALL_PAYMENT_METHOD_STATUSES),
      canViewPaymentCode:
        isRoot || permissions.includes(PERMISSIONS.VIEW_PAYMENT_CODE),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate payment method access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate access control for payment method lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a payment method lookup filter object.
 *
 * Restricted users are pinned to active-only results. Keyword searches are
 * restricted to name-only for users without payment code visibility. Keywords
 * that match a code format (`ALL_CAPS_WITH_UNDERSCORES`) are blocked outright
 * to prevent code-based enumeration.
 *
 * @param {object} [filters={}] - Base filter object from the request.
 * @param {PaymentMethodLookupAcl} userAccess - Resolved ACL from `evaluatePaymentMethodLookupAccessControl`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 * @throws {AppError} authorizationError if a code-format keyword is used without permission.
 */
const enforcePaymentMethodLookupVisibilityRules = (
  filters = {},
  userAccess
) => {
  const adjusted = { ...filters };
  
  if (!userAccess.canViewAllStatuses) {
    adjusted.isActive = true;
  } else {
    delete adjusted.isActive;
  }
  
  if (!userAccess.canViewPaymentCode && adjusted.keyword) {
    const keyword = adjusted.keyword.trim();
    
    // Block keywords that match a code format — prevents unauthorized code enumeration.
    if (/^[A-Z0-9_]+$/.test(keyword)) {
      throw AppError.authorizationError('Filtering by code is not allowed.');
    }
    
    adjusted._restrictKeywordToNameOnly = true;
  }
  
  return adjusted;
};

/**
 * Enriches a payment method lookup row with a derived `isActive` boolean flag.
 *
 * @param {object} row - Raw payment method row from the repository.
 * @returns {object & { isActive: boolean }}
 */
const enrichPaymentMethodOption = (row) => {
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
