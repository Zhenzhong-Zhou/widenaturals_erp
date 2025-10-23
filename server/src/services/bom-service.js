const { getPaginatedBoms, getBomDetailsById } = require('../repositories/bom-repository');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const { transformPaginatedOBoms, transformBomDetails } = require('../transformers/bom-transformer');
const AppError = require('../utils/AppError');
const { computeEstimatedBomCostSummary } = require('../business/bom-business');

/**
 * @async
 * @function
 * @description
 * Fetches a paginated, filterable, and sortable list of Bill of Materials (BOM) records.
 *
 * Acts as the business-layer wrapper around the repository function {@link getPaginatedBoms},
 * handling structured logging, standardized error propagation, and transformation of
 * raw SQL rows into normalized BOM objects via {@link transformPaginatedOBoms}.
 *
 * Intended use case:
 * - BOM management views requiring list display with filters, sorting, and pagination.
 * - Admin dashboards or data exports needing consistent, enriched BOM data.
 *
 * @async
 * @param {Object} options - Query and pagination options.
 * @param {Object} [options.filters={}] - Optional filtering criteria (e.g., `keyword`, `statusId`, `isActive`, `skuCode`).
 * @param {number} [options.page=1] - Current page number for pagination.
 * @param {number} [options.limit=10] - Number of records to return per page.
 * @param {string} [options.sortBy] - Column or SQL alias to sort by (e.g., `'p.name'`).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sorting direction for the query results.
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Resolves with a structured list of BOM records and pagination metadata.
 *
 * @throws {AppError} Throws a `serviceError` if repository query, transformation, or logging fails.
 *
 * @example
 * const result = await fetchPaginatedBomsService({
 *   filters: { keyword: 'Capsule', isActive: true },
 *   page: 2,
 *   limit: 20,
 *   sortBy: 'p.name',
 *   sortOrder: 'ASC'
 * });
 *
 * console.table(result.data);
 * // -> [{ product: {...}, sku: {...}, bom: {...} }, ...]
 *
 * console.log(result.pagination);
 * // -> { page: 2, limit: 20, totalRecords: 52, totalPages: 3 }
 *
 * @see getPaginatedBoms
 * @see transformPaginatedOBoms
 * @see logSystemInfo
 * @see logSystemException
 * @see AppError.serviceError
 */
const fetchPaginatedBomsService = async ({
                                           filters = {},
                                           page = 1,
                                           limit = 10,
                                           sortBy,
                                           sortOrder = 'DESC',
                                         }) => {
  try {
    // Step 1. Fetch data
    const rawResult = await getPaginatedBoms({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // Step 2. Return structured response
    logSystemInfo('Fetched BOM list successfully', {
      context: 'bom-service/fetchPaginatedBomsService',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      count: rawResult.pagination.totalRecords,
    });
    
    return transformPaginatedOBoms(rawResult);
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated BOMs', {
      context: 'bom-service/fetchPaginatedBomsService',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.serviceError('Failed to fetch BOM list', {
      context: 'bom-service/fetchPaginatedBomsService',
      originalError: error.message,
      pagination: { page, limit },
    });
  }
};

/**
 * Fetch and transform full BOM details by BOM ID.
 *
 * Responsibilities:
 *  - Validate BOM ID input (controller/Joi handles most validation)
 *  - Query database via repository (`getBomDetailsById`)
 *  - Transform flat SQL rows into structured nested BOM detail object
 *  - Optionally enrich data (e.g., cost summary, audit formatting)
 *  - Provide consistent logging and standardized error handling
 *
 * @async
 * @function
 * @param {string} bomId - UUID of the BOM to fetch details for.
 * @returns {Promise<{ header: object, details: object[], summary?: object }>} Structured BOM details with optional summary.
 * @throws {AppError} When BOM is invalid, not found, or query fails.
 *
 * @example
 * const bom = await fetchBomDetailsService('b8a81f8f-45b1-4c4a-9a2b-ef8e2a123456');
 * console.log(bom.header.bom.code); // "BOM-PG-TCM300-R-CN"
 */
const fetchBomDetailsService = async (bomId) => {
  try {
    // Step 1: Query repository for BOM details
    const rawData = await getBomDetailsById(bomId);
    
    if (!rawData || rawData.length === 0) {
      throw AppError.notFoundError('No BOM details found for the provided BOM ID', {
        bomId,
        context: 'bom-service/fetchBomDetailsService',
      });
    }
    
    // Step 2: Transform raw rows into structured BOM details
    const structuredResult = transformBomDetails(rawData);
    
    // Step 3: Optional enrichment hook — compute aggregate stats (future expansion)
    structuredResult.summary = computeEstimatedBomCostSummary?.(structuredResult) ?? null;
    
    // Step 4: Log success
    logSystemInfo('Fetched BOM details successfully', {
      context: 'bom-service/fetchBomDetailsService',
      bomId,
      rowCount: rawData.length,
      totalCost: structuredResult.summary?.totalEstimatedCost ?? null,
    });
    
    return structuredResult;
  } catch (error) {
    // Step 5: Log and rethrow standardized error
    logSystemException(error, 'Failed to fetch BOM details', {
      context: 'bom-service/fetchBomDetailsService',
      bomId,
    });
    
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unexpected error fetching BOM details', {
      bomId,
      context: 'bom-service/fetchBomDetailsService',
      originalError: error.message,
    });
  }
};

module.exports = {
  fetchPaginatedBomsService,
  fetchBomDetailsService,
};
