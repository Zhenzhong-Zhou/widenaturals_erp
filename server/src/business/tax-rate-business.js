const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/tax-rate-constants');

/**
 * Calculates the taxable amount and tax amount for a sales order.
 *
 * Applies business rules: ensures taxable amount is never below zero,
 * and calculates tax as a percentage of the post-discount subtotal.
 *
 * @param {number} subtotal - The subtotal amount before discounts and tax.
 * @param {number} discountAmount - The discount to subtract from subtotal.
 * @param {number} taxRate - The tax rate (e.g., 5 for 5%).
 * @returns {{
 *   taxableAmount: number;
 *   taxAmount: number;
 * }} - The calculated taxable amount and tax amount.
 *
 * @throws {AppError} - If calculation fails unexpectedly.
 */
const calculateTaxableAmount = (subtotal, discountAmount, taxRate) => {
  try {
    const taxableAmount = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxableAmount * (taxRate / 100);

    return {
      taxableAmount,
      taxAmount,
    };
  } catch (error) {
    logSystemException(error, 'Failed to calculate taxable amount and tax', {
      context: 'order-business/calculateTaxableAmount',
      subtotal,
      discountAmount,
      taxRate,
    });

    throw AppError.businessError('Unable to calculate tax amounts.');
  }
};

/**
 * Determines whether the user can access hidden or extended tax rate lookup values
 * based on their assigned permissions.
 *
 * @param {Object} user - Authenticated user object with a permission set
 * @returns {Promise<{
 *   canViewAllIsActive: boolean,
 *   canViewAllValidLookups: boolean
 * }>} Promise resolving to access flags for tax rate lookup visibility
 */
const evaluateTaxRateLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllStatuses =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_TAX_RATE_STATES);

    const canViewAllValidLookups =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_TAX_RATES);

    return {
      canViewAllStatuses,
      canViewAllValidLookups,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate tax rate lookup access control',
      {
        context: 'tax-rate-business/evaluateTaxRateLookupAccessControl',
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user access control for tax rate lookup',
      {
        details: err.message,
        stage: 'evaluate-tax-rate-lookup-access',
      }
    );
  }
};

/**
 * Enforces visibility restrictions on keyword and is_active filtering
 * for tax rate lookup based on user access permissions.
 *
 * If the user lacks permission to view all valid tax rates and provides a keyword filter,
 * a `_restrictKeywordToValidOnly` flag is added to constrain the query to current valid records.
 *
 * If the user lacks permission to view all statuses, any `isActive` filter is removed,
 * and an `isActive` filter is forced to `true`.
 *
 * @param {Object} filters - Original filter object (e.g., `keyword`, `isActive`)
 * @param {Object} userAccess - Access flags (e.g., `canViewAllValidLookups`, `canViewAllStatuses`)
 * @returns {Object} Adjusted filters with enforced visibility rules
 */
const enforceTaxRateLookupVisibilityRules = (filters, userAccess) => {
  const adjusted = { ...filters };

  // Restrict keyword visibility to currently valid records only
  if (filters.keyword && !userAccess.canViewAllValidLookups) {
    adjusted._restrictKeywordToValidOnly = true;
  }

  // Enforce isActive = true if user can't view all
  if (!userAccess.canViewAllStatuses) {
    adjusted.isActive = true;
  }

  return adjusted;
};

/**
 * Applies access control filters to a tax rate lookup query based on user permissions.
 *
 * If the user lacks permission to view all `is_active` states, the query is restricted to `is_active = true`.
 * If the user lacks permission to view all valid tax rates, the query is restricted to:
 *   `valid_from <= now` AND (`valid_to >= now OR valid_to IS NULL`)
 *
 * @param {Object} query - Original query object with filters.
 * @param {Object} userAccess - Flags for user permissions (`canViewAllStatuses`, `canViewAllValidLookups`).
 * @returns {Object} Modified query object with enforced access filters.
 */
const filterTaxRateLookupQuery = (query, userAccess) => {
  try {
    const modifiedQuery = { ...query };
    const now = new Date().toISOString();

    if (!userAccess.canViewAllStatuses) {
      modifiedQuery.is_active = true;
    }

    if (!userAccess.canViewAllValidLookups) {
      modifiedQuery.valid_from = { lte: now }; // valid_from <= now
      modifiedQuery.valid_to = { gteOrNull: now }; // valid_to >= now OR IS NULL
    }

    return modifiedQuery;
  } catch (err) {
    logSystemException(
      err,
      'Failed to apply access filters in filterTaxRateLookupQuery',
      {
        context: 'tax-rate-business/filterTaxRateLookupQuery',
        originalQuery: query,
        userAccess,
      }
    );

    throw AppError.businessError(
      'Unable to apply tax rate lookup access filters',
      {
        details: err.message,
        stage: 'filter-tax-rate-lookup',
        cause: err,
      }
    );
  }
};

/**
 * Enriches a tax rate row with computed flags like isValidToday.
 *
 * @param {Object} row - Raw tax rate row with `is_active`, `valid_from`, and `valid_to`
 * @returns {Object} Enriched row with `isValidToday` (and keeps `is_active` as-is)
 */
const enrichTaxRateRow = (row) => {
  const now = new Date();

  return {
    ...row,
    isActive: row.is_active,
    isValidToday:
      row.valid_from <= now && (!row.valid_to || row.valid_to >= now),
  };
};

module.exports = {
  calculateTaxableAmount,
  evaluateTaxRateLookupAccessControl,
  enforceTaxRateLookupVisibilityRules,
  filterTaxRateLookupQuery,
  enrichTaxRateRow,
};
