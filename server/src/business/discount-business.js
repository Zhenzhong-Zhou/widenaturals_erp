/**
 * @file discount-business.js
 * @description Domain business logic for discount amount calculation, access
 * control evaluation, visibility rule application, query filtering, and
 * lookup row enrichment.
 */

'use strict';

const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/discount-constants');

const CONTEXT = 'discount-business';

/**
 * Calculates the discount amount for a given subtotal based on the discount type.
 *
 * Supports `PERCENTAGE` and `FIXED_AMOUNT` discount types.
 * Returns `0` if no discount is provided.
 *
 * @param {number} subtotal - The order subtotal to apply the discount to.
 * @param {{ discount_type: string, discount_value: number } | null} discount - Discount record.
 * @returns {number} Calculated discount amount.
 * @throws {AppError} validationError if the discount type is not supported.
 */
const calculateDiscountAmount = (subtotal, discount) => {
  if (!discount) return 0;

  if (discount.discount_type === 'PERCENTAGE') {
    return subtotal * (discount.discount_value / 100);
  }

  if (discount.discount_type === 'FIXED_AMOUNT') {
    return discount.discount_value;
  }

  throw AppError.validationError(
    `Unsupported discount type: ${discount.discount_type}`
  );
};

/**
 * Resolves which discount lookup visibility capabilities the requesting
 * user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<DiscountLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateDiscountLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateDiscountLookupAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_DISCOUNT_STATUSES),
      canViewAllValidLookups:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_DISCOUNTS),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate discount lookup access control',
      {
        context,
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user access control for discount lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a discount lookup filter object.
 *
 * Restricted users are pinned to active-only results and keyword searches
 * are restricted to currently valid discounts only.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {DiscountLookupAcl} userAccess - Resolved ACL from `evaluateDiscountLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforceDiscountLookupVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  // Restrict keyword searches to valid discounts only for unpermitted users.
  if (filters.keyword && !userAccess.canViewAllValidLookups) {
    adjusted._restrictKeywordToValidOnly = true;
  }

  if (!userAccess.canViewAllStatuses) {
    // Remove caller-supplied statusId — active status is pinned via _activeStatusId.
    delete adjusted.statusId;
    if (activeStatusId) {
      adjusted._activeStatusId = activeStatusId;
    }
  }

  return adjusted;
};

/**
 * Injects a `validOn` date into the query for users who cannot view all
 * valid discounts, restricting results to currently active discount windows.
 *
 * @param {object} query - Raw query object from the request.
 * @param {DiscountLookupAcl} userAccess - Resolved ACL from `evaluateDiscountLookupAccessControl`.
 * @returns {object} Adjusted copy of `query` with validity filter applied if needed.
 */
const filterDiscountLookupQuery = (query, userAccess) => {
  const modifiedQuery = { ...query };

  // Pin to today's date for users who cannot view discounts outside valid windows.
  if (!userAccess.canViewAllValidLookups) {
    modifiedQuery.validOn = new Date().toISOString();
  }

  return modifiedQuery;
};

/**
 * Enriches a discount lookup row with derived boolean flags.
 *
 * @param {object} row - Raw discount row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean, isValidToday: boolean }}
 */
const enrichDiscountRow = (row, activeStatusId) => {
  const now = new Date();

  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    isValidToday:
      row.valid_from <= now && (!row.valid_to || row.valid_to >= now),
  };
};

module.exports = {
  calculateDiscountAmount,
  evaluateDiscountLookupAccessControl,
  enforceDiscountLookupVisibilityRules,
  filterDiscountLookupQuery,
  enrichDiscountRow,
};
