const AppError = require('../utils/AppError');
const { getBatchRegistryDropdown } = require('../repositories/batch-registry-repository');
const { getWarehouseDropdown } = require('../repositories/warehouse-repository');
const {
  transformPaginatedDropdownResultList,
  transformWarehouseDropdownRows
} = require('../transformers/dropdown-transformer');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');

/**
 * Service to fetch filtered and paginated batch registry records for dropdown UI.
 *
 * @param {Object} options - Query options.
 * @param {Object} options.filters - Filtering parameters.
 * @param {number} [options.limit=50] - Number of records to fetch.
 * @param {number} [options.offset=0] - Offset for pagination.
 * @returns {Promise<Object[]>} - Transformed dropdown items.
 */
const fetchBatchRegistryDropdownService = async ({ filters = {}, limit = 50, offset = 0 }) => {
  try {
    if (limit < 1 || offset < 0) {
      throw AppError.validationError('Invalid pagination parameters.');
    }
    
    logSystemInfo('Fetching batch registry dropdown from service', {
      context: 'dropdown-service/fetchBatchRegistryDropdown',
      metadata: { filters, limit, offset },
    });
    
    const rawResult = await getBatchRegistryDropdown({ filters, limit, offset });
    return transformPaginatedDropdownResultList(rawResult);
    
  } catch (err) {
    logSystemException(err, 'Failed to fetch batch registry dropdown in service', {
      context: 'dropdown-service/fetchBatchRegistryDropdown',
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Failed to fetch batch registry dropdown list.', {
      details: err.message,
      stage: 'fetchBatchRegistryDropdownService',
    });
  }
};

/**
 * Service to fetch a filtered list of warehouses for dropdown use.
 *
 * Supports filtering by location type, warehouse type, and archived status.
 *
 * @param {Object} filters - Filtering options
 * @param {string} [filters.locationTypeId] - Optional location type ID to filter warehouses
 * @param {string} [filters.warehouseTypeId] - Optional warehouse type ID to filter warehouses
 * @param {boolean} [filters.includeArchived] - Whether to include archived warehouses
 * @returns {Promise<Array>} Resolved list of transformed warehouse dropdown items
 * @throws {AppError} Throws a service-level error if retrieval or transformation fails
 */
const fetchWarehouseDropdownService = async (filters = {}) => {
  try {
    logSystemInfo('Fetching warehouse dropdown in service', {
      context: 'warehouse-service/fetchWarehouseDropdownService',
      filters,
    });
    
    const rawResult = await getWarehouseDropdown(filters);
    return transformWarehouseDropdownRows(rawResult);
  } catch (err) {
    logSystemException(err, 'Failed to fetch warehouse dropdown in service layer', {
      context: 'warehouse-service/fetchWarehouseDropdownService',
      filters,
    });
    
    throw AppError.serviceError('Could not fetch warehouse dropdown', {
      details: err.message,
      stage: 'warehouse-service',
    });
  }
};

module.exports = {
  fetchBatchRegistryDropdownService,
  fetchWarehouseDropdownService,
};
