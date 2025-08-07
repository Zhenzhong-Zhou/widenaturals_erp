const { logSystemWarn, logSystemException } = require('../utils/system-logger');
const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/pricing-constants');
const AppError = require('../utils/AppError');

/**
 * Resolves the final price for an order item based on submitted price and DB price.
 *
 * Applies business rules:
 * - If submitted price equals DB price → use DB price
 * - If submitted price is positive and different → allow manual price (override)
 * - Otherwise fallback to DB price
 *
 * @param {number|string|null|undefined} submittedPrice - Price submitted by client
 * @param {number|string} dbPrice - Price from DB
 * @returns {number} - Final price to apply
 */
const resolveFinalPrice = (submittedPrice, dbPrice) => {
  const cleanSubmittedPrice = parseFloat(submittedPrice);
  const cleanDbPrice = parseFloat(dbPrice);

  if (isNaN(cleanSubmittedPrice)) {
    return cleanDbPrice;
  }

  if (cleanSubmittedPrice === cleanDbPrice) {
    return cleanDbPrice;
  }

  if (cleanSubmittedPrice > 0 && cleanSubmittedPrice !== cleanDbPrice) {
    logSystemWarn('Manual price override applied', {
      submittedPrice: cleanSubmittedPrice,
      dbPrice: cleanDbPrice,
    });
    // Optionally log manual override here if you want
    return cleanSubmittedPrice;
  }

  return cleanDbPrice;
};

/**
 * Determines whether the user can access hidden or extended pricing lookup values
 * based on their assigned permissions.
 *
 * Typically used to control visibility of:
 * - Inactive or draft pricing records
 * - Pricing records outside the current validity range
 *
 * @param {Object} user - Authenticated user object with a permission set
 * @returns {Promise<{
 *   canViewAllStatuses: boolean,
 *   canViewAllValidLookups: boolean
 * }>} Promise resolving to access flags for pricing lookup visibility
 */
const evaluatePricingLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewAllStatuses =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PRICING_STATES);
    
    const canViewAllValidLookups =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_PRICING);
    
    return {
      canViewAllStatuses,
      canViewAllValidLookups,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate pricing lookup access control', {
      context: 'pricing-business/evaluatePricingLookupAccessControl',
      userId: user?.id,
    });
    
    throw AppError.businessError('Unable to evaluate user access control for pricing lookup', {
      details: err.message,
      stage: 'evaluate-pricing-lookup-access',
    });
  }
};

/**
 * Enforces visibility restrictions on keyword and status-based filtering
 * for pricing lookup based on user access permissions.
 *
 * - If the user provides a keyword but lacks permission to view all valid pricing,
 *   a `_restrictKeywordToValidOnly` flag is added to constrain the query to currently valid records.
 *
 * - If the user lacks permission to view all pricing statuses,
 *   any `statusId` filter is removed and the filter is forced to the active status.
 *
 * @param {Object} filters - Original filter object (e.g., statusId, priceTypeId, etc.)
 * @param {Object} userAccess - Access flags (e.g., `canViewAllValidLookups`, `canViewAllStatuses`)
 * @param {string} [activeStatusId] - The UUID of the active status to enforce if user lacks permission
 * @returns {Object} Adjusted filters with enforced visibility rules
 */
const enforcePricingLookupVisibilityRules = (filters, userAccess, activeStatusId) => {
  const adjusted = { ...filters };
  
  const keywordUsed = filters.keyword && filters.keyword.trim().length > 0;
  
  // Restrict keyword visibility to currently valid pricing only
  if (keywordUsed && !userAccess.canViewAllValidLookups) {
    adjusted._restrictKeywordToValidOnly = true;
  }
  
  // Enforce statusId = active if user can't view all statuses
  if (!userAccess.canViewAllStatuses && activeStatusId) {
    adjusted.statusId = activeStatusId;
  }
  
  return adjusted;
};

/**
 * Applies access control filters to a pricing lookup query based on user permissions.
 *
 * - If the user lacks permission to view all pricing statuses,
 *   the query is restricted to `statusId = activeStatusId`.
 *
 * - If the user lacks permission to view all valid pricing,
 *   the query is restricted to:
 *     `valid_from <= now` AND (`valid_to >= now OR valid_to IS NULL`)
 *
 * @param {Object} query - Original query object with filters.
 * @param {Object} userAccess - Flags for user permissions (`canViewAllStatuses`, `canViewAllValidLookups`).
 * @param {string} activeStatusId - UUID of the active status to enforce if needed.
 * @returns {Object} Modified query object with enforced access filters.
 */
const filterPricingLookupQuery = (query, userAccess, activeStatusId) => {
  try {
    const modifiedQuery = { ...query };
    const now = new Date().toISOString();
    
    if (!userAccess.canViewAllStatuses && activeStatusId) {
      modifiedQuery.statusId = activeStatusId;
    }
    
    if (!userAccess.canViewAllValidLookups) {
      modifiedQuery.valid_from = { lte: now }; // valid_from <= now
      modifiedQuery.valid_to = { gteOrNull: now }; // valid_to >= now OR IS NULL
    }
    
    return modifiedQuery;
  } catch (err) {
    logSystemException(err, 'Failed to apply access filters in filterPricingLookupQuery', {
      context: 'pricing-business/filterPricingLookupQuery',
      originalQuery: query,
      userAccess,
    });
    
    throw AppError.businessError('Unable to apply pricing lookup access filters', {
      details: err.message,
      stage: 'filter-pricing-lookup',
      cause: err,
    });
  }
};

/**
 * Enriches a pricing row with computed flags like isActive and isValidToday.
 *
 * This is useful for client-side display or API formatting where status and validity
 * need to be expressed as boolean flags rather than raw status IDs and timestamps.
 *
 * @param {Object} row - Raw pricing row with `status_id`, `valid_from`, and `valid_to`
 * @param {string|number} activeStatusId - The status ID representing "active"
 * @returns {Object} Enriched row with `isActive` and `isValidToday` booleans
 */
const enrichPricingRow = (row, activeStatusId) => {
  const now = new Date();
  
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    isValidToday:
      row.valid_from <= now && (!row.valid_to || row.valid_to >= now),
  };
};

module.exports = {
  resolveFinalPrice,
  evaluatePricingLookupAccessControl,
  enforcePricingLookupVisibilityRules,
  filterPricingLookupQuery,
  enrichPricingRow,
};
