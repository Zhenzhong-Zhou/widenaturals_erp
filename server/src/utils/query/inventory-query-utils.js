const { sanitizeSortOrder, sanitizeSortBy } = require('../sort-utils');
const { SORTABLE_FIELDS } = require('../sort-field-mapping');
const { cleanObject } = require('../object-utils');

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
const normalizePaginationAndSortParams = ({ page, limit, sortByRaw, sortOrderRaw }, sortMapKey) => {
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
    createdAt: query.createdAt || undefined,
    ...(isLocation && {
      locationName: query.locationName || undefined,
      inboundDate: query.inboundDate || undefined,
      expiryDate: query.expiryDate || undefined,
    }),
    ...(isWarehouse && {
      warehouseName: query.warehouseName || undefined,
    }),
  };
  
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

module.exports = {
  normalizePaginationAndSortParams,
  sanitizeCommonInventoryFilters,
};
