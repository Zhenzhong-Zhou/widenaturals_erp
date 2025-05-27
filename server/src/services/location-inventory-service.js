const {
  getLocationInventoryKpiSummary,
  getHighLevelLocationInventorySummary,
  getLocationInventorySummaryDetailsByItemId,
  getPaginatedLocationInventoryRecords,
} = require('../repositories/location-inventory-repository');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemInfo
} = require('../utils/system-logger');
const {
  transformPaginatedLocationInventorySummaryResult,
  transformPaginatedLocationInventorySummaryDetails,
  transformLocationInventoryKpiSummary,
  transformPaginatedLocationInventoryRecordResults,
} = require('../transformers/location-inventory-transformer');
const { sanitizeSortBy, sanitizeSortOrder } = require('../utils/sort-utils');
const { FILTERABLE_FIELDS } = require('../utils/filter-field-mapping');

/**
 * Service to fetch and transform KPI summary data for location inventory.
 *
 * Retrieves summarized inventory metrics (e.g., totals, availability, expiry counts),
 * optionally filtered by item type ('product' or 'packaging_material').
 *
 * @param {Object} options - Query options for the KPI summary.
 * @param {'product' | 'packaging_material'} [options.itemType] - Optional filter to restrict results to a specific item type.
 * @returns {Promise<Array<Object>>} A promise resolving to an array of transformed KPI summary objects.
 */
const fetchLocationInventoryKpiSummaryService = async ({ itemType } = {}) => {
  try {
    logSystemInfo('Fetching location inventory KPI summary', {
      context: 'location-inventory-service/locationInventoryKpiService',
      itemType: itemType ?? 'all',
    });
    
    const rawRows = await getLocationInventoryKpiSummary({ itemType });
    return transformLocationInventoryKpiSummary(rawRows);
  } catch (error) {
    logSystemException(error, 'Error fetching location inventory KPI summary', {
      context: 'location-inventory-service/locationInventoryKpiService',
      itemType,
    });
    throw AppError.serviceError('Failed to fetch location inventory KPI summary');
  }
};

/**
 * Fetches paginated location inventory summary records with filters, sorting, and
 * derived inventory logic.
 *
 * Designed for displaying high-level inventory data (products or packaging materials)
 * from the `location_inventory` table, including
 * - Structured product/material metadata
 * - Derived inventory health flags (e.g., isExpired, isLowStock)
 * - Quantity and date normalization
 *
 * @param {Object} options - Query parameters
 * @param {number} options.page - Current page number (1-based)
 * @param {number} options.limit - Number of records per page
 * @param {Object} options.filters - Inventory filters (e.g., productName, lotNumber, locationId)
 * @param {string} [options.sortBy='createdAt'] - Logical sort key (mapped internally to SQL columns)
 * @param {string} [options.sortOrder='ASC'] - Sort direction: 'ASC' or 'DESC'
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Transformed summary inventory result
 */
const fetchPaginatedLocationInventorySummaryService = async ({ page, limit, filters, sortBy, sortOrder }) => {
  try {
    logSystemInfo('Fetching location inventory summary', {
      context: 'location-inventory-service/fetchPaginatedLocationInventorySummaryService',
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });
    
    const sortByClause = sanitizeSortBy(sortBy || 'createdAt','locationInventorySummarySortMap');
    const sortOrderClause = sanitizeSortOrder(sortOrder);
    
    const rawResult = await getHighLevelLocationInventorySummary({
      page,
      limit,
      filters,
      sortBy: sortByClause,
      sortOrder: sortOrderClause,
    });
    
    return transformPaginatedLocationInventorySummaryResult(rawResult);
  } catch (error) {
    logSystemException(error, 'Error fetching location inventory summary', {
      context: 'location-inventory-service/fetchPaginatedLocationInventorySummaryService',
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });
    
    throw AppError.serviceError('Failed to fetch location inventory summary');
  }
};

/**
 * Service to fetch and transform paginated location inventory summary details
 * by item ID (product SKU or packaging material).
 *
 * @param {Object} options - Query options.
 * @param {number} options.page - The current page number.
 * @param {number} options.limit - The number of records per page.
 * @param {string} options.itemId - The SKU ID or material ID to filter by.
 * @returns {Promise<Object>} Paginated and transformed location inventory summary response.
 * @throws {AppError} If the underlying query or transformation fails.
 */
const fetchPaginatedLocationInventorySummaryByItemIdService = async ({ page, limit, itemId }) => {
  try {
    const rawResult = await getLocationInventorySummaryDetailsByItemId({ page, limit, itemId });
    
    logSystemInfo('Successfully fetched location inventory summary', {
      context: 'location-inventory-service/fetchPaginatedLocationInventorySummaryByItemIdService',
      itemId,
      page,
      limit,
      resultCount: rawResult?.data?.length ?? 0,
    });
    
    return transformPaginatedLocationInventorySummaryDetails(rawResult);
  } catch (error) {
    logSystemException(error, 'Failed to fetch and transform location inventory summary', {
      context: 'location-inventory-service/fetchPaginatedLocationInventorySummaryByItemIdService',
      itemId,
      page,
      limit,
    });
    
    throw AppError.serviceError('Unable to retrieve location inventory summary for the given item.');
  }
};

/**
 * Service to retrieve paginated location inventory records with full metadata.
 *
 * This service fetches raw location inventory data from the database using provided filters,
 * applies dynamic sorting and pagination, and transforms the results into a structured,
 * display-friendly format for frontend consumption.
 *
 * @param {Object} options - Parameters for querying the inventory data
 * @param {number} options.page - The current page number (1-based index)
 * @param {number} options.limit - The number of records per page
 * @param {Object} [options.filters] - Optional filters for narrowing results by fields such as batchType, locationName, productName, etc.
 * @param {string} [options.sortByRaw] - Optional raw sort key from frontend (e.g. "productName", "inboundDate")
 * @param {string} [options.sortOrderRaw='ASC'] - Optional sort order direction: 'ASC' or 'DESC'
 *
 * @returns {Promise<Object>} - An object containing the paginated, filtered, and transformed location inventory results:
 *    {
 *      data: Array<Object>,        // Transformed location inventory records
 *      pagination: {
 *        page: number,             // Current page
 *        limit: number,            // Items per page
 *        totalRecords: number,     // Total matching records
 *        totalPages: number        // Total number of pages
 *      }
 *    }
 */
const fetchPaginatedLocationInventoryRecordService = async ({ page, limit, filters, sortByRaw, sortOrderRaw }) => {
  try {
    const sortByExpression =
      sortByRaw?.trim()
        ? sanitizeSortBy(sortByRaw, 'locationInventorySortMap')
        : FILTERABLE_FIELDS.locationInventorySortMap.defaultNaturalSort;

    // Only append sortOrder if sortBy is a single column
    const safeSortClause = sortByExpression.includes(',') || sortByExpression.includes('CASE')
      ? sortByExpression
      : `${sortByExpression} ${sanitizeSortOrder(sortOrderRaw)}`;
    
    const rawResult = await getPaginatedLocationInventoryRecords({
      page,
      limit,
      filters,
      safeSortClause
    });
    return transformPaginatedLocationInventoryRecordResults(rawResult);
  } catch (error) {
    logSystemException(error, 'Failed in locationInventoryService.getPaginatedLocationInventory', {
      context: 'location-inventory-service/getPaginatedLocationInventory',
      page,
      limit,
      filters,
    });
    
    throw AppError.serviceError('Failed to retrieve location inventory data.');
  }
};

module.exports = {
  fetchLocationInventoryKpiSummaryService,
  fetchPaginatedLocationInventorySummaryService,
  fetchPaginatedLocationInventorySummaryByItemIdService,
  fetchPaginatedLocationInventoryRecordService,
};
