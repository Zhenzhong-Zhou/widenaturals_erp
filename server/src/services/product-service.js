const {
  getAvailableProductsForDropdown,
  getProductsForDropdown,
  getPaginatedProducts,
} = require('../repositories/product-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { transformPaginatedProductResults } = require('../transformers/product-transformer');

const fetchProductDropdownList = async (warehouse_id) => {
  try {
    return await getAvailableProductsForDropdown(warehouse_id);
  } catch (error) {
    throw AppError.serviceError(
      `Failed to fetch product dropdown: ${error.message}`
    );
  }
};

/**
 * Fetches available products for the dropdown menu.
 * Applies business logic for formatting results.
 *
 * @param {string|null} search - Optional search term for filtering (product name, SKU, or barcode).
 * @param {number} limit - Maximum number of results to fetch (Default: 100).
 * @returns {Promise<Array<{ id: string, label: string }>>}
 */
const fetchAvailableProductsForDropdown = async (
  search = null,
  limit = 100
) => {
  try {
    const products = await getProductsForDropdown(search, limit);

    // Apply business logic (e.g., formatting label with SKU and barcode if needed)
    return products.map((product) => ({
      id: product.id,
      label: `${product.label}`, // Optionally include SKU or barcode if required
    }));
  } catch (error) {
    logError('Error fetching products for dropdown (Service Layer):', error);
    throw AppError.serviceError('Failed to fetch products for dropdown');
  }
};

/**
 * Service: Fetch Paginated Products
 *
 * Provides a service-level abstraction over repository queries for products.
 * Handles pagination, filtering, transformation, and structured logging.
 *
 * ### Flow
 * 1. Delegates to `getPaginatedProducts` in the repository layer with
 *    provided filters, pagination, and sorting options.
 * 2. If no results are found:
 *    - Logs an informational event (`No products found`)
 *    - Returns an empty `data` array with zeroed pagination metadata.
 * 3. If results are found:
 *    - Transforms raw SQL rows into clean, API-ready objects via
 *      `transformPaginatedProductResults`.
 *    - Logs a successful fetch event with context and metadata.
 * 4. On error:
 *    - Logs the exception with contextual metadata.
 *    - Throws a service-level `AppError` with a user-friendly message.
 *
 * ### Parameters
 * @param {Object} options - Query options
 * @param {Object} [options.filters={}] - Filtering criteria (delegated to buildProductFilter)
 * @param {number} [options.page=1] - Current page number (1-based)
 * @param {number} [options.limit=10] - Max rows per page
 * @param {string} [options.sortBy='created_at'] - Sort column (validated before query)
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction
 *
 * ### Returns
 * @returns {Promise<{
 *   data: any[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   };
 * }>} Paginated product results
 *
 * ### Errors
 * @throws {AppError} - Wrapped service error if repository execution fails
 *
 * ### Example
 * ```ts
 * const { data, pagination } = await fetchPaginatedProductsService({
 *   filters: { keyword: 'Omega', brand: 'Canaherb' },
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'created_at',
 *   sortOrder: 'DESC',
 * });
 * ```
 */
const fetchPaginatedProductsService = async ({
                                               filters = {},
                                               page = 1,
                                               limit = 10,
                                               sortBy = 'created_at',
                                               sortOrder = 'DESC',
                                             }) => {
  try {
    // Step 1: Query raw paginated product rows from repository
    const rawResult = await getPaginatedProducts({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // Step 2: Handle no results
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No products found', {
        context: 'product-service/fetchPaginatedProductsService',
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
    
    // Step 3: Transform raw SQL rows into clean API-ready objects
    const result = transformPaginatedProductResults(rawResult);
    
    // Step 4: Log success
    logSystemInfo('Fetched paginated product records successfully', {
      context: 'product-service/fetchPaginatedProductsService',
      filters,
      pagination: result.pagination,
      sort: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    // Step 5: Log exception and rethrow as service-level error
    logSystemException(error, 'Failed to fetch paginated product records', {
      context: 'product-service/fetchPaginatedProductsService',
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });
    
    throw AppError.serviceError(
      'Could not fetch products. Please try again later.',
      {
        context: 'product-service/fetchPaginatedProductsService',
        details: error.message,
      }
    );
  }
};

module.exports = {
  fetchProductDropdownList,
  fetchAvailableProductsForDropdown,
  fetchPaginatedProductsService,
};
