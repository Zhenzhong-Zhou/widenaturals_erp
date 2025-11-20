const { getPaginatedComplianceRecords } = require('../repositories/compliance-record-repository');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { transformPaginatedComplianceRecordResults } = require('../transformers/compliance-record-transfomer');
const AppError = require('../utils/AppError');

/**
 * Fetches paginated, filtered, and sorted compliance records.
 *
 * This service:
 *   - Accepts normalized filter inputs for compliance record searches
 *   - Delegates SQL query execution to the repository layer
 *   - Applies a consistent pagination wrapper
 *   - Transforms raw SQL rows into API-safe objects
 *   - Logs system activity and handles error propagation
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Filter options for narrowing down results.
 *
 * @param {number} [params.page=1] - Page number (1-based).
 * @param {number} [params.limit=10] - Number of records per page.
 *
 * @param {string} [params.sortBy='cr.created_at'] - SQL-safe ORDER BY column.
 * @param {('ASC'|'DESC')} [params.sortOrder='DESC'] - Sort direction.
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>}
 *
 * @throws {AppError} ServiceError when the compliance records cannot be fetched.
 */
const fetchPaginatedComplianceRecordsService = async ({
                                                        filters = {},
                                                        page = 1,
                                                        limit = 10,
                                                        sortBy = 'cr.created_at', // MUST be SQL-safe column
                                                        sortOrder = 'DESC',
                                                      }) => {
  const context = 'compliance-service/fetchPaginatedComplianceRecordsService';
  
  try {
    // ---------------------------------------------------------
    // Step 1 — Query raw data from repository
    // ---------------------------------------------------------
    const rawResult = await getPaginatedComplianceRecords({
      filters,
      page,
      limit,
      sortBy,     // SQL-safe column
      sortOrder,
    });
    
    // ---------------------------------------------------------
    // Step 2 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No compliance records found', {
        context,
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      });
      
      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }
    
    // ---------------------------------------------------------
    // Step 3 — Transform results
    // ---------------------------------------------------------
    const result = transformPaginatedComplianceRecordResults(rawResult);
    
    // ---------------------------------------------------------
    // Step 4 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Fetched paginated compliance records successfully', {
      context,
      filters,
      pagination: result.pagination,
      sort: { sortBy, sortOrder },
    });
    
    return result;
    
  } catch (error) {
    // ---------------------------------------------------------
    // Step 5 — Log + rethrow
    // ---------------------------------------------------------
    logSystemException(
      error,
      'Failed to fetch paginated compliance records',
      {
        context,
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      },
    );
    
    throw AppError.serviceError(
      'Could not fetch compliance records. Please try again later.',
      { context }
    );
  }
};

module.exports = {
  fetchPaginatedComplianceRecordsService,
};
