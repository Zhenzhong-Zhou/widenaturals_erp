const AppError = require('../utils/AppError');
const { getBatchRegistryDropdown } = require('../repositories/batch-registry-repository');
const { transformPaginatedDropdownResultList } = require('../transformers/dropdown-transformer');
const { logSystemInfo } = require('../utils/system-logger');

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
  if (limit < 1 || offset < 0) {
    throw AppError.validationError('Invalid pagination parameters.');
  }
  
  logSystemInfo('Fetching batch registry dropdown from service', {
    context: 'dropdown-service/fetchBatchRegistryDropdown',
    metadata: { filters, limit, offset },
  });
  
  const rawResult = await getBatchRegistryDropdown({ filters, limit, offset });
  console.log(rawResult)
  return transformPaginatedDropdownResultList(rawResult);
};

module.exports = {
  fetchBatchRegistryDropdownService,
};
