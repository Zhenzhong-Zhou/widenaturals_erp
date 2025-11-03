const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/discount-constants');

/**
 * Calculates the discount amount based on discount type and subtotal.
 *
 * Applies business rules based on discount type (`PERCENTAGE` or `FIXED`).
 * Returns 0 if no discount is provided or type is unsupported.
 *
 * @param {number} subtotal - The original subtotal before discount.
 * @param {object|null} discount - The discount object containing type and value.
 * @param {string} discount.discount_type - Type of discount: 'PERCENTAGE' or 'FIXED'.
 * @param {number} discount.discount_value - The numeric value of the discount.
 * @returns {number} - The computed discount amount, or 0 if not applicable.
 *
 * @throws {AppError} - If a calculation error occurs.
 */
const calculateDiscountAmount = (subtotal, discount) => {
  try {
    if (!discount) return 0;

    if (discount.discount_type === 'PERCENTAGE') {
      return subtotal * (discount.discount_value / 100);
    }

    if (discount.discount_type === 'FIXED_AMOUNT') {
      return discount.discount_value;
    }

    // Throw for unsupported type
    throw AppError.validationError(
      `Unsupported discount type: ${discount.discount_type}`
    );
  } catch (error) {
    logSystemException(error, 'Failed to calculate discount amount', {
      context: 'discount-business/calculateDiscountAmount',
      discount,
      subtotal,
    });
    throw AppError.businessError('Unable to calculate discount amount.');
  }
};

/**
 * Evaluates user permission context to determine access to extended lookup options.
 *
 * Determines if the user has permission to:
 * - View all discount statuses (including inactive or hidden)
 * - View all discount validity periods (including expired or future ones)
 *
 * Root users are automatically granted full access.
 *
 * @param {Object} user - Authenticated user object with a role.
 * @returns {Promise<{
 *   canViewAllStatuses: boolean,
 *   canViewAllValidLookups: boolean
 * }>}
 *
 * @throws {AppError} If the permission resolution fails.
 */
const evaluateDiscountLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllStatuses =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_DISCOUNT_STATUSES);

    const canViewAllValidLookups =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_DISCOUNTS);

    return {
      canViewAllStatuses,
      canViewAllValidLookups,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate lookup access control', {
      context: 'discount-business/evaluateLookupAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate user access control for discount lookup',
      {
        details: err.message,
        stage: 'evaluate-lookup-access',
      }
    );
  }
};

/**
 * Enforces visibility restrictions on keyword and status filtering
 * based on user access permissions.
 *
 * If the user lacks permission to view all valid records and provides a keyword filter,
 * a special `_restrictKeywordToValidOnly` flag is added.
 *
 * If the user lacks permission to view all statuses, any `status_id` filter is removed,
 * and `_activeStatusId` is added to constrain filtering.
 *
 * @param {Object} filters - Original filter object (may include `keyword`, `status_id`, etc.)
 * @param {Object} userAccess - Access flags (e.g., `canViewAllValidLookups`, `canViewAllStatuses`)
 * @param {string|number} [activeStatusId] - Default status ID (e.g., for "active")
 * @returns {Object} Updated filters with restricted access rules applied
 */
const enforceDiscountLookupVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  // Restrict keyword visibility to valid discounts only
  if (filters.keyword && !userAccess.canViewAllValidLookups) {
    adjusted._restrictKeywordToValidOnly = true;
  }

  // Enforce active-only restriction if user can't view all statuses
  if (!userAccess.canViewAllStatuses) {
    delete adjusted.statusId;
    if (activeStatusId) {
      adjusted._activeStatusId = activeStatusId;
    }
  }

  return adjusted;
};

/**
 * Applies access control filters to a discount lookup query based on user permissions.
 *
 * If the user lacks permission to view all statuses, the `statusId` filter is removed.
 * If the user lacks permission to view all valid discounts, the query is restricted to
 * currently valid discounts (i.e., `valid_from <= now` and `valid_to >= now OR IS NULL`).
 *
 * @param {Object} query - Original query object with filters.
 * @param {Object} userAccess - Flags for user permissions (`canViewAllStatuses`, `canViewAllValidLookups`).
 * @returns {Object} Modified query object with enforced access filters.
 */
const filterDiscountLookupQuery = (query, userAccess) => {
  try {
    const modifiedQuery = { ...query };

    // Only inject validOn if needed
    if (!userAccess.canViewAllValidLookups) {
      modifiedQuery.validOn = new Date().toISOString();
    }

    return modifiedQuery;
  } catch (err) {
    logSystemException(
      err,
      'Failed to apply access filters in filterDiscountLookupQuery',
      {
        context: 'discount-business/filterDiscountLookupQuery',
        originalQuery: query,
        userAccess,
      }
    );

    throw AppError.businessError(
      'Failed to apply access control filters to discount query',
      {
        details: err.message,
        stage: 'filter-discount-lookup-query',
      }
    );
  }
};

/**
 * Enriches a discount row with computed flags like isActive and isValidToday.
 *
 * @param {Object} row - Raw discount row with `status_id`, `valid_from`, and `valid_to`
 * @param {string|number} activeStatusId - The status ID representing "active"
 * @returns {Object} Enriched row with `isActive` and `isValidToday` booleans
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
