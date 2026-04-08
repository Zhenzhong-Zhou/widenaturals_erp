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

/**
 * Evaluates pricing SKU table visibility permissions for the given user.
 *
 * @param {Object} user - Authenticated user object.
 * @returns {Promise<PricingAcl>}
 * @throws {AppError} businessError if permission context cannot be resolved.
 */
const evaluatePricingVisibility = async (user) => {
  const context = `${CONTEXT}/evaluatePricingVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewAllPricingStates =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_PRICING_STATES);
    
    const canViewAllValidPricing =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_VALID_PRICING);
    
    const canViewInactive =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_INACTIVE);
    
    const canViewHistory =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_HISTORY);
    
    const canExportPricing =
      isRoot ||
      permissions.includes(PERMISSIONS.EXPORT_PRICING);
    
    return {
      canViewAllPricingStates,
      canViewAllValidPricing,
      canViewInactive,
      canViewHistory,
      canExportPricing,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate pricing visibility', {
      context,
      userId: user?.id,
    });
    throw AppError.businessError('Unable to evaluate pricing visibility.');
  }
};

/**
 * Applies pricing SKU table visibility rules to the filter set.
 *
 * - No view permission → fail closed via forceEmptyResult.
 * - Injects server-side validity flags based on ACL.
 *
 * @param {Object}      filters - Raw filter object from the controller.
 * @param {PricingAcl}  acl     - Resolved ACL from evaluatePricingVisibility.
 * @returns {Object} Adjusted filters.
 */
const applyPricingVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  // Restrict to currently valid pricing unless user can view all valid states.
  if (!acl.canViewAllValidPricing) {
    adjusted.currentlyValid = true;
  }
  
  // Restrict to active status unless user can view inactive.
  if (!acl.canViewInactive && !acl.canViewAllPricingStates) {
    adjusted._restrictKeywordToValidOnly = true;
  }
  
  return adjusted;
};

module.exports = {
  resolveFinalPrice,
  evaluatePricingViewAccessControl,
  slicePricingForUser,
  evaluatePricingVisibility,
  applyPricingVisibilityRules,
};
