const { sanitizeSortOrder, sanitizeSortBy } = require('../sort-utils');
const { SORTABLE_FIELDS } = require('../sort-field-mapping');
const { cleanObject } = require('../object-utils');
const { INVENTORY_STATUS } = require('../constants/domain/status-constants');
const { getStatusId } = require('../../config/status-cache');

/**
 * Normalizes pagination and sort clause for inventory queries.
 *
 * @param {Object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} options.sortByRaw
 * @param {string} options.sortOrderRaw
 * @param {string} sortMapKey - e.g. 'locationInventorySortMap' or 'warehouseInventorySortMap'
 * @returns {{ page: number, limit: number, safeSortClause: string }}
 */
const normalizePaginationAndSortParams = (
  { page, limit, sortByRaw, sortOrderRaw },
  sortMapKey
) => {
  const resolvedPage = parseInt(page, 10) || 1;
  const resolvedLimit = parseInt(limit, 10) || 20;

  const sortByExpression = sortByRaw?.trim()
    ? sanitizeSortBy(sortByRaw, sortMapKey)
    : SORTABLE_FIELDS[sortMapKey].defaultNaturalSort;

  const safeSortClause =
    sortByExpression.includes(',') || sortByExpression.includes('CASE')
      ? sortByExpression
      : `${sortByExpression} ${sanitizeSortOrder(sortOrderRaw)}`;

  return {
    page: resolvedPage,
    limit: resolvedLimit,
    safeSortClause,
  };
};

/**
 * Sanitizes and normalizes common filters used in inventory queries
 * for both location-based and warehouse-based inventory records.
 *
 * Automatically excludes:
 * - Irrelevant fields based on the `batchType`
 * - Context-specific fields (e.g., `locationName` vs `warehouseName`)
 * - Fields with empty string values (`''`)
 *
 * @param {Object} query - Raw query parameters from the request (e.g., req.query)
 * @param {Object} options - Options for filter sanitization
 * @param {'location'|'warehouse'} options.type - The inventory context
 *
 * @returns {Object} A cleaned filter object with only valid, context-appropriate filters
 */
const sanitizeCommonInventoryFilters = (query, { type }) => {
  const isLocation = type === 'location';
  const isWarehouse = type === 'warehouse';
  
  const filters = {
    batchType: query.batchType || undefined,
    productName: query.productName || undefined,
    materialName: query.materialName || undefined,
    materialCode: query.materialCode || undefined,
    partName: query.partName || undefined,
    partCode: query.partCode || undefined,
    partType: query.partType || undefined,
    sku: query.sku || undefined,
    lotNumber: query.lotNumber || undefined,
    status: query.status || undefined,
    
    // ─────────────────────────────
    // Date ranges (shared)
    // ─────────────────────────────
    createdAfter: query.createdAfter || undefined,
    createdBefore: query.createdBefore || undefined,
    
    ...(isLocation && {
      locationName: query.locationName || undefined,
      inboundAfter: query.inboundAfter || undefined,
      inboundBefore: query.inboundBefore || undefined,
      expiryAfter: query.expiryAfter || undefined,
      expiryBefore: query.expiryBefore || undefined,
    }),
    
    ...(isWarehouse && {
      warehouseName: query.warehouseName || undefined,
      inboundAfter: query.inboundAfter || undefined,
      inboundBefore: query.inboundBefore || undefined,
      expiryAfter: query.expiryAfter || undefined,
      expiryBefore: query.expiryBefore || undefined,
    }),
  };
  
  // ─────────────────────────────
  // Batch-type–specific cleanup
  // ─────────────────────────────
  if (filters.batchType === 'product') {
    delete filters.materialName;
    delete filters.materialCode;
    delete filters.partName;
    delete filters.partCode;
    delete filters.partType;
  } else if (filters.batchType === 'packaging_material') {
    delete filters.productName;
    delete filters.sku;
  }
  
  return cleanObject(filters);
};

/**
 * Returns the appropriate inventory status ID based on the quantity.
 * Uses `getStatusId()` to resolve UUIDs from logical status keys.
 *
 * - If quantity > 0 → returns 'inventory_in_stock' ID
 * - If quantity <= 0 → returns 'inventory_out_of_stock' ID
 * - If neither found, falls back to 'inventory_unassigned'
 *
 * @param {number} quantity - Quantity to evaluate
 * @param {string} [fallback=INVENTORY_STATUS.UNASSIGNED] - Fallback status key
 * @returns {string} UUID status ID
 * @throws {Error} If no valid status key or fallback is found
 */
const getStatusIdByQuantity = (
  quantity,
  fallback = INVENTORY_STATUS.UNASSIGNED
) => {
  const statusKey =
    quantity <= 0 ? INVENTORY_STATUS.OUT_OF_STOCK : INVENTORY_STATUS.IN_STOCK;

  try {
    return getStatusId(statusKey);
  } catch (err) {
    return getStatusId(fallback);
  }
};

module.exports = {
  normalizePaginationAndSortParams,
  sanitizeCommonInventoryFilters,
  getStatusIdByQuantity,
};
