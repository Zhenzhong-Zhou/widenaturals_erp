/**
 * @file tax-rate-business.js
 * @description Domain business logic for tax amount calculation, access control
 * evaluation, visibility rule application, query filtering, and row enrichment.
 */

'use strict';

const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/tax-rate-constants');

const CONTEXT = 'tax-rate-business';

/**
 * Calculates the taxable amount and tax due for an order.
 *
 * Taxable amount is `max(subtotal - discountAmount, 0)` to prevent negative
 * tax bases.
 *
 * @param {number} subtotal - Order subtotal before discount.
 * @param {number} discountAmount - Discount amount to deduct from subtotal.
 * @param {number} taxRate - Tax rate as a percentage (e.g. `13` for 13%).
 * @returns {{ taxableAmount: number, taxAmount: number }}
 */
const calculateTaxableAmount = (subtotal, discountAmount, taxRate) => {
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount     = taxableAmount * (taxRate / 100);
  
  return { taxableAmount, taxAmount };
};

/**
 * Resolves which tax rate lookup visibility capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<TaxRateLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateTaxRateLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateTaxRateLookupAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_TAX_RATE_STATES),
      canViewAllValidLookups:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_TAX_RATES),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate tax rate lookup access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate user access control for tax rate lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a tax rate lookup filter object.
 *
 * Restricted users are pinned to active records only. Keyword searches are
 * restricted to currently valid records for unpermitted users.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {TaxRateLookupAcl} userAccess - Resolved ACL from `evaluateTaxRateLookupAccessControl`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforceTaxRateLookupVisibilityRules = (filters, userAccess) => {
  const adjusted = { ...filters };
  
  // Restrict keyword searches to currently valid records for unpermitted users.
  if (filters.keyword && !userAccess.canViewAllValidLookups) {
    adjusted._restrictKeywordToValidOnly = true;
  }
  
  if (!userAccess.canViewAllStatuses) {
    adjusted.isActive = true;
  }
  
  return adjusted;
};

/**
 * Applies validity window and status filters to a tax rate lookup query.
 *
 * Restricted users are limited to currently valid records
 * (`valid_from <= now` and `valid_to >= now OR NULL`).
 *
 * @param {object} query - Raw query object from the request.
 * @param {TaxRateLookupAcl} userAccess - Resolved ACL from `evaluateTaxRateLookupAccessControl`.
 * @returns {object} Adjusted copy of `query` with access filters applied.
 */
const filterTaxRateLookupQuery = (query, userAccess) => {
  const modifiedQuery = { ...query };
  const now           = new Date().toISOString();
  
  if (!userAccess.canViewAllStatuses) {
    modifiedQuery.is_active = true;
  }
  
  if (!userAccess.canViewAllValidLookups) {
    modifiedQuery.valid_from = { lte: now };
    modifiedQuery.valid_to   = { gteOrNull: now };
  }
  
  return modifiedQuery;
};

/**
 * Enriches a tax rate row with a derived `isValidToday` boolean flag.
 *
 * @param {object} row - Raw tax rate row from the repository.
 * @returns {object & { isActive: boolean, isValidToday: boolean }}
 */
const enrichTaxRateRow = (row) => {
  const now = new Date();
  
  return {
    ...row,
    isActive:     row.is_active,
    isValidToday: row.valid_from <= now && (!row.valid_to || row.valid_to >= now),
  };
};

module.exports = {
  calculateTaxableAmount,
  evaluateTaxRateLookupAccessControl,
  enforceTaxRateLookupVisibilityRules,
  filterTaxRateLookupQuery,
  enrichTaxRateRow,
};
