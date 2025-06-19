const AppError = require('../utils/AppError');
const {
  getBatchRegistryLookup,
} = require('../repositories/batch-registry-repository');
const {
  getWarehouseLookup,
} = require('../repositories/warehouse-repository');
const {
  transformPaginatedLookupResultList,
  transformWarehouseLookupRows, transformLotAdjustmentLookupOptions,
} = require('../transformers/lookup-transformer');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const { getLotAdjustmentTypeLookupOptions } = require('../repositories/lot-adjustment-type-repository');

/**
 * Service to fetch filtered and paginated batch registry records for lookup UI.
 *
 * @param {Object} options - Query options.
 * @param {Object} options.filters - Filtering parameters.
 * @param {number} [options.limit=50] - Number of records to fetch.
 * @param {number} [options.offset=0] - Offset for pagination.
 * @returns {Promise<Object[]>} - Transformed lookup items.
 */
const fetchBatchRegistryLookupService = async ({
  filters = {},
  limit = 50,
  offset = 0,
}) => {
  try {
    if (limit < 1 || offset < 0) {
      throw AppError.validationError('Invalid pagination parameters.');
    }

    logSystemInfo('Fetching batch registry lookup from service', {
      context: 'lookup-service/fetchBatchRegistryLookupService',
      metadata: { filters, limit, offset },
    });

    const rawResult = await getBatchRegistryLookup({
      filters,
      limit,
      offset,
    });
    return transformPaginatedLookupResultList(rawResult);
  } catch (err) {
    logSystemException(
      err,
      'Failed to fetch batch registry lookup in service',
      {
        context: 'lookup-service/fetchBatchRegistryLookupService',
        filters,
        limit,
        offset,
      }
    );

    throw AppError.serviceError(
      'Failed to fetch batch registry lookup list.',
      {
        details: err.message,
        stage: 'lookup-service/fetchBatchRegistryLookupService',
      }
    );
  }
};

/**
 * Service to fetch a filtered list of warehouses for lookup use.
 *
 * Supports filtering by location type, warehouse type, and archived status.
 *
 * @param {Object} filters - Filtering options
 * @param {string} [filters.locationTypeId] - Optional location type ID to filter warehouses
 * @param {string} [filters.warehouseTypeId] - Optional warehouse type ID to filter warehouses
 * @param {boolean} [filters.includeArchived] - Whether to include archived warehouses
 * @returns {Promise<Array>} Resolved list of transformed warehouse lookup items
 * @throws {AppError} Throws a service-level error if retrieval or transformation fails
 */
const fetchWarehouseLookupService = async (filters = {}) => {
  try {
    logSystemInfo('Fetching warehouse lookup in service', {
      context: 'lookup-service/fetchWarehouseLookupService',
      filters,
    });

    const rawResult = await getWarehouseLookup(filters);
    return transformWarehouseLookupRows(rawResult);
  } catch (err) {
    logSystemException(
      err,
      'Failed to fetch warehouse lookup in service layer',
      {
        context: 'lookup-service/fetchWarehouseLookupService',
        filters,
      }
    );

    throw AppError.serviceError('Could not fetch warehouse lookup', {
      details: err.message,
      stage: 'lookup-service/fetchWarehouseLookupService',
    });
  }
};

/**
 * Fetches and transforms active lot adjustment types into lookup-friendly format.
 *
 * Internal-use types (e.g., `'manual_stock_insert'`, `'manual_stock_update'`) are excluded by default,
 * unless `excludeInternal` is explicitly set to `false`.
 *
 * @param {Object} [filters={}] - Optional filter options.
 * @param {boolean} [filters.excludeInternal=false] - If true, excludes internal-only adjustment types.
 * @returns {Promise<Array<{ value: string, label: string, actionTypeId: string }>>} A list of transformed lookup options:
 * - `value`: the lot adjustment type ID,
 * - `label`: the display name,
 * - `actionTypeId`: the associated inventory action type ID.
 *
 * @throws {AppError} If fetching or transforming data fails.
 */
const fetchLotAdjustmentLookupService = async (filters = {}) => {
  try {
    const rows = await getLotAdjustmentTypeLookupOptions(filters);
    return transformLotAdjustmentLookupOptions(rows);
  } catch (error) {
    logSystemException(error, 'Failed to fetch and transform lot adjustment types', {
      context: 'lookup-service/fetchLotAdjustmentLookupService',
      filters,
    });
    throw AppError.serviceError('Unable to retrieve adjustment lookup options');
  }
};

module.exports = {
  fetchBatchRegistryLookupService,
  fetchWarehouseLookupService,
  fetchLotAdjustmentLookupService,
};
