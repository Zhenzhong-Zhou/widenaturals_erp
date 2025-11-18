const { logSystemWarn, logSystemException } = require('../utils/system-logger');
const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/pricing-constants');
const AppError = require('../utils/AppError');
const { getStatusId } = require('../config/status-cache');

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
    logSystemException(
      err,
      'Failed to evaluate pricing lookup access control',
      {
        context: 'pricing-business/evaluatePricingLookupAccessControl',
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user access control for pricing lookup',
      {
        details: err.message,
        stage: 'evaluate-pricing-lookup-access',
      }
    );
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
const enforcePricingLookupVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
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
    logSystemException(
      err,
      'Failed to apply access filters in filterPricingLookupQuery',
      {
        context: 'pricing-business/filterPricingLookupQuery',
        originalQuery: query,
        userAccess,
      }
    );

    throw AppError.businessError(
      'Unable to apply pricing lookup access filters',
      {
        details: err.message,
        stage: 'filter-pricing-lookup',
        cause: err,
      }
    );
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

/**
 * Business: Evaluate pricing visibility permissions for SKU detail or pricing lookup.
 *
 * This determines whether a user can view:
 *   - Any pricing at all
 *   - All pricing types (MSRP, Retail, Wholesale, Distributor, etc.)
 *   - Inactive pricing (status != active)
 *   - Expired or future-dated pricing (pricing history)
 *   - Internal-only pricing (via VIEW_ALL_VALID_PRICING)
 *
 * Notes:
 *   • This function does NOT decide which pricing rows appear — that is handled
 *     by slicePricingForUser().
 *   • This returns a set of boolean flags describing what the user *can* see.
 *
 * @param {Object} user - Authenticated user context with permission list
 * @returns {Promise<{
 *   canViewPricing: boolean,
 *   canViewAllPricingTypes: boolean,
 *   canViewInactivePricing: boolean,
 *   canViewPricingHistory: boolean,
 *   canViewAllValidPricing: boolean,
 * }>}
 */
const evaluatePricingViewAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    // Base permission: can the user view ANY pricing?
    const canViewPricing =
      isRoot || permissions.includes(PERMISSIONS.VIEW_PRICING);
    
    // Extended permissions
    const canViewAllPricingTypes =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_TYPES);
    
    const canViewInactivePricing =
      isRoot || permissions.includes(PERMISSIONS.VIEW_INACTIVE);
    
    const canViewPricingHistory =
      isRoot || permissions.includes(PERMISSIONS.VIEW_HISTORY);
    
    // Expired + future-dated pricing visibility
    const canViewAllValidPricing =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_PRICING);
    
    return {
      canViewPricing,
      canViewAllPricingTypes,
      canViewInactivePricing,
      canViewPricingHistory,
      canViewAllValidPricing,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate SKU pricing view access control',
      {
        context: 'pricing-business/evaluatePricingViewAccessControl',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to determine pricing visibility permissions',
      { details: err.message }
    );
  }
};

/**
 * Business: Filter and redact pricing rows based on user's access control.
 *
 * Responsibilities:
 *   ✔ Remove price types the user is not allowed to view
 *   ✔ Remove inactive pricing unless allowed
 *   ✔ Remove expired pricing unless allowed
 *   ✔ Remove future pricing unless allowed
 *   ✔ Redact status & audit fields for regular users
 *
 * This function enforces WHAT the user is allowed to see,
 * while evaluatePricingViewAccessControl() determines WHY.
 *
 * @param {Array<Object>} pricingRows - Raw rows from repository
 * @param {Object} access - Access flags from evaluatePricingViewAccessControl()
 * @returns {Array<Object>} Safe pricing objects suitable for API response
 */
const slicePricingForUser = (pricingRows, access) => {
  const ACTIVE_STATUS_ID = getStatusId('general_active');
  
  if (!Array.isArray(pricingRows)) return [];
  
  // Public price types visible to all normal users
  const PUBLIC_PRICE_TYPES = ['MSRP', 'RETAIL'];
  
  const now = new Date();
  const result = [];
  
  for (const row of pricingRows) {
    const priceTypeName = row.price_type_name?.toUpperCase();
    
    // ---------------------------------------------------------
    // 1. PRICE TYPE FILTER
    //    Only users with VIEW_ALL_TYPES can see wholesale/internal pricing
    // ---------------------------------------------------------
    if (!access.canViewAllPricingTypes) {
      if (!PUBLIC_PRICE_TYPES.includes(priceTypeName)) continue;
    }
    
    // ---------------------------------------------------------
    // 2. INACTIVE PRICING FILTER
    // ---------------------------------------------------------
    if (!access.canViewInactivePricing && row.status_id !== ACTIVE_STATUS_ID) {
      continue;
    }
    
    // ---------------------------------------------------------
    // 3. VALIDITY WINDOW FILTER
    //    Regular users cannot see expired or future-dated pricing
    // ---------------------------------------------------------
    const validFrom = row.valid_from ? new Date(row.valid_from) : null;
    const validTo = row.valid_to ? new Date(row.valid_to) : null;
    
    const isExpired = validTo && validTo < now;
    const isNotYetValid = validFrom && validFrom > now;
    
    if (!access.canViewPricingHistory && isExpired) continue;
    
    if (!access.canViewAllValidPricing && isNotYetValid) continue;
    
    // ---------------------------------------------------------
    // 4. BASE SAFE SHAPE (regular users)
    // ---------------------------------------------------------
    const safe = {
      id: row.id,
      skuId: row.sku_id,
      priceType: { name: row.price_type_name },
      location: {
        name: row.location_name,
        type: row.location_type,
      },
      price: row.price,
      validFrom: row.valid_from,
      validTo: row.valid_to,
    };
    
    // ---------------------------------------------------------
    // 5. EXTENDED: status fields (admins + advanced roles)
    // ---------------------------------------------------------
    if (access.canViewAllPricingTypes) {
      safe.status = {
        id: row.status_id,
        date: row.status_date,
      };
    }
    
    // ---------------------------------------------------------
    // 6. EXTENDED: audit fields (admins + auditors)
    // ---------------------------------------------------------
    if (access.canViewPricingHistory) {
      safe.audit = {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
      };
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
