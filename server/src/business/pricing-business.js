/**
 * @file pricing-business.js
 * @description Domain business logic for pricing access control evaluation,
 * visibility rule application, final price resolution, row enrichment,
 * and row-level field slicing.
 */

'use strict';

const { logSystemWarn, logSystemException } = require('../utils/logging/system-logger');
const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/pricing-constants');
const AppError = require('../utils/AppError');
const { getStatusId } = require('../config/status-cache');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

const CONTEXT = 'pricing-business';

/** Price types visible to all users without elevated pricing permissions. */
const PUBLIC_PRICE_TYPES = ['MSRP', 'RETAIL'];

/**
 * Resolves the final unit price to use for an order line.
 *
 * Uses the submitted price if it is a valid positive number that differs from
 * the DB price — treating it as a manual override. Warns when an override is
 * applied. Falls back to the DB price in all other cases.
 *
 * @param {number | string} submittedPrice - Price submitted by the caller.
 * @param {number | string} dbPrice - Authoritative price from the database.
 * @returns {number} Resolved final price.
 */
const resolveFinalPrice = (submittedPrice, dbPrice) => {
  const context = `${CONTEXT}/resolveFinalPrice`;
  
  const cleanSubmittedPrice = parseFloat(submittedPrice);
  const cleanDbPrice        = parseFloat(dbPrice);
  
  if (isNaN(cleanSubmittedPrice)) return cleanDbPrice;
  if (cleanSubmittedPrice === cleanDbPrice) return cleanDbPrice;
  
  if (cleanSubmittedPrice > 0 && cleanSubmittedPrice !== cleanDbPrice) {
    logSystemWarn('Manual price override applied', {
      context,
      submittedPrice: cleanSubmittedPrice,
      dbPrice: cleanDbPrice,
    });
    return cleanSubmittedPrice;
  }
  
  return cleanDbPrice;
};

/**
 * Resolves which pricing lookup visibility capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<PricingLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluatePricingLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluatePricingLookupAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PRICING_STATES),
      canViewAllValidLookups:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_PRICING),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate pricing lookup access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate user access control for pricing lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a pricing lookup filter object.
 *
 * Restricted users are pinned to the active status. Keyword searches are
 * restricted to currently valid pricing only for unpermitted users.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {PricingLookupAcl} userAccess - Resolved ACL from `evaluatePricingLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforcePricingLookupVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };
  
  // Restrict keyword searches to currently valid pricing for unpermitted users.
  if (filters.keyword?.trim().length > 0 && !userAccess.canViewAllValidLookups) {
    adjusted._restrictKeywordToValidOnly = true;
  }
  
  if (!userAccess.canViewAllStatuses && activeStatusId) {
    adjusted.statusId = activeStatusId;
  }
  
  return adjusted;
};

/**
 * Applies validity window and status filters to a pricing lookup query.
 *
 * Restricted users are limited to currently valid pricing records
 * (`valid_from <= now` and `valid_to >= now OR NULL`).
 *
 * @param {object} query - Raw query object from the request.
 * @param {PricingLookupAcl} userAccess - Resolved ACL from `evaluatePricingLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `query` with access filters applied.
 */
const filterPricingLookupQuery = (query, userAccess, activeStatusId) => {
  const modifiedQuery = { ...query };
  const now           = new Date().toISOString();
  
  if (!userAccess.canViewAllStatuses && activeStatusId) {
    modifiedQuery.statusId = activeStatusId;
  }
  
  if (!userAccess.canViewAllValidLookups) {
    modifiedQuery.valid_from = { lte: now };
    modifiedQuery.valid_to   = { gteOrNull: now };
  }
  
  return modifiedQuery;
};

/**
 * Enriches a pricing lookup row with derived boolean flags.
 *
 * @param {object} row - Raw pricing row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean, isValidToday: boolean }}
 */
const enrichPricingRow = (row, activeStatusId) => {
  const now = new Date();
  
  return {
    ...row,
    isActive:     row.status_id === activeStatusId,
    isValidToday: row.valid_from <= now && (!row.valid_to || row.valid_to >= now),
  };
};

/**
 * Resolves which pricing detail viewing capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<PricingViewAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluatePricingViewAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluatePricingViewAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewPricing:
        isRoot || permissions.includes(PERMISSIONS.VIEW_PRICING),
      canViewAllPricingTypes:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_TYPES),
      canViewInactivePricing:
        isRoot || permissions.includes(PERMISSIONS.VIEW_INACTIVE),
      canViewPricingHistory:
        isRoot || permissions.includes(PERMISSIONS.VIEW_HISTORY),
      canViewAllValidPricing:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_PRICING),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate pricing view access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to determine pricing visibility permissions.'
    );
  }
};

/**
 * Filters and shapes a list of pricing rows based on the user's access flags.
 *
 * Applies four sequential filters:
 * - Price type: non-public types excluded for restricted users.
 * - Inactive status: inactive records excluded unless permitted.
 * - Expired pricing: excluded unless the user can view pricing history.
 * - Future-dated pricing: excluded unless the user can view all valid pricing.
 *
 * Status and audit fields are conditionally included based on the ACL.
 *
 * @param {object[]} pricingRows - Raw pricing rows from the repository.
 * @param {PricingViewAcl} access - Resolved ACL from `evaluatePricingViewAccessControl`.
 * @returns {object[]} Filtered and shaped pricing records.
 */
const slicePricingForUser = (pricingRows, access) => {
  if (!Array.isArray(pricingRows)) return [];
  
  const ACTIVE_STATUS_ID = getStatusId('general_active');
  const now = new Date();
  const result = [];
  
  for (const row of pricingRows) {
    const priceTypeName = row.price_type_name?.toUpperCase();
    
    // Non-public price types require elevated access.
    if (
      !access.canViewAllPricingTypes &&
      !PUBLIC_PRICE_TYPES.includes(priceTypeName)
    ) {
      continue;
    }
    
    if (!access.canViewInactivePricing && row.status_id !== ACTIVE_STATUS_ID) {
      continue;
    }
    
    const validFrom = row.valid_from ? new Date(row.valid_from) : null;
    const validTo = row.valid_to ? new Date(row.valid_to) : null;
    const isExpired = validTo && validTo < now;
    const isNotYetValid = validFrom && validFrom > now;
    
    if (!access.canViewPricingHistory && isExpired) continue;
    if (!access.canViewAllValidPricing && isNotYetValid) continue;
    
    const safe = {
      id: row.pricing_id ?? row.id,
      skuId: row.sku_id,
      pricingGroupId: row.pricing_group_id,
      priceType: {
        name: row.price_type_name,
        code: row.price_type_code,
      },
      countryCode: row.country_code,
      price: row.price,
      validFrom: row.valid_from,
      validTo: row.valid_to,
    };
    
    if (access.canViewAllPricingTypes) {
      safe.status = {
        id: row.status_id,
        date: row.status_date,
      };
    }
    
    if (access.canViewPricingHistory) {
      safe.audit = compactAudit(makeAudit(row));
    }
    
    result.push(safe);
  }
  
  return result;
};

module.exports = {
  resolveFinalPrice,
  evaluatePricingLookupAccessControl,
  enforcePricingLookupVisibilityRules,
  filterPricingLookupQuery,
  enrichPricingRow,
  evaluatePricingViewAccessControl,
  slicePricingForUser,
};
