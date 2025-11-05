const {
  getAvailableProductsForDropdown,
  getProductsForDropdown,
  getPaginatedProducts,
  getProductDetailsById,
  updateProductStatus,
} = require('../repositories/product-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  transformPaginatedProductResults,
  transformProductDetail
} = require('../transformers/product-transformer');
const { withTransaction, lockRow } = require('../database/db');
const { checkStatusExists } = require('../repositories/status-repository');
const { assertValidProductStatusTransition } = require('../business/product-business');

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

/**
 * Service: Fetch Product Details by ID
 *
 * Provides a service-level abstraction for fetching a single product record
 * from the repository, including status and audit information.
 *
 * ### Flow
 * 1. Delegates to `getProductDetailsById` in the repository layer.
 * 2. If no product is found:
 *    - Logs an informational event (`No product found for given ID`)
 *    - Throws an AppError.notFound for clean controller handling.
 * 3. If found:
 *    - Transforms raw SQL row via `transformProductDetail` into an API-ready object.
 *    - Logs a successful fetch event with contextual metadata.
 * 4. On error:
 *    - Logs the exception and wraps it in a service-level `AppError`.
 *
 * ### Parameters
 * @param {string} productId - The UUID of the product to fetch.
 *
 * ### Returns
 * @returns {Promise<object>} Clean, transformed product detail object.
 *
 * ### Errors
 * - `AppError.notFound` if the product does not exist.
 * - `AppError.serviceError` if an unexpected error occurs.
 *
 * ### Example
 * ```ts
 * const product = await fetchProductDetailsService('b7f5c613-22aa-4cb3-94d4-ff9d7f87b7a4');
 * console.log(product.status.name); // "Active"
 * ```
 */
const fetchProductDetailsService = async (productId) => {
  const logContext = 'product-service/fetchProductDetailsService';
  
  try {
    // Step 1: Fetch raw product row from repository
    const rawProduct = await getProductDetailsById(productId);
    
    // Step 2: Handle not found
    if (!rawProduct) {
      logSystemInfo('No product found for given ID', {
        context: logContext,
        productId,
      });
      
      throw AppError.notFoundError('Product not found', {
        context: logContext,
        productId,
      });
    }
    
    // Step 3: Transform into API-ready format
    const product = transformProductDetail(rawProduct);
    
    // Step 4: Log success
    logSystemInfo('Fetched product detail successfully', {
      context: logContext,
      productId,
    });
    
    return product;
  } catch (error) {
    // Step 5: Log exception and rethrow as service-level error
    logSystemException(error, 'Failed to fetch product detail', {
      context: logContext,
      productId,
      error: error.message,
    });
    
    // Bubble up structured service error
    throw AppError.serviceError('Could not fetch product details. Please try again later.', {
      context: logContext,
      productId,
      details: error.message,
    });
  }
};

/**
 * Service: Update Product Status
 *
 * Performs a transactional product status update with full concurrency protection,
 * validation, and logging. Designed for internal ERP workflows where product state
 * transitions must follow strict business rules.
 *
 * ### Flow
 * 1. Begin transaction and lock product row (`FOR UPDATE`).
 * 2. Verify the target status exists in the `status` table.
 * 3. Validate current → next transition rules (via business validator).
 * 4. Update product's status and audit metadata.
 * 5. Commit transaction and return updated record ID.
 *
 * @param {Object} options
 * @param {string} options.productId - Product UUID
 * @param {string} options.statusId - Target status UUID
 * @param {{ id: string }} options.user - Authenticated user performing the action
 * @returns {Promise<{ id: string }>} Updated product record ID
 * @throws {AppError} If validation fails or database error occurs
 */
const updateProductStatusService = async ({ productId, statusId, user }) => {
  return withTransaction(async (client) => {
    const userId = user.id;
    
    // Step 1: Lock product
    const product = await lockRow(client, 'products', productId, 'FOR UPDATE', {
      context: 'product-service/updateProductStatusService',
    });
    
    // Step 2: Validate status
    const statusExists = await checkStatusExists(statusId, client);
    if (!statusExists) {
      throw AppError.validationError('Invalid or inactive status ID.');
    }
    
    // Step 3: Basic validation
    if (product.status_id === statusId) {
      throw AppError.validationError('Product is already in this status.');
    }
    
    // Optional: Step 4 - Apply business rule validation
    assertValidProductStatusTransition(product.status_id, statusId);
    
    // Step 5: Update product status
    const updated = await updateProductStatus(productId, statusId, userId, client);
    
    if (!updated) {
      throw AppError.conflictError('Concurrent update detected — product status not updated.');
    }
    
    // Step 6: Log success
    logSystemInfo('Updated product status successfully', {
      context: 'product-service/updateProductStatusService',
      productId,
      fromStatusId: product.status_id,
      toStatusId: statusId,
      userId,
    });
    
    return updated;
  });
};

// const updateProductInfoService = async ({ productId, statusCode, userId }) => {
//   return withTransaction(async (client) => {
//     const status = await statusRepository.getByCode(statusCode, 'product', client);
//     await updateProductStatus(productId, status.id, userId, client);
//     logSystemInfo('Product status updated', { productId, statusCode, updatedBy: userId });
//     return { success: true };
//   });
// };

module.exports = {
  fetchPaginatedProductsService,
  fetchProductDetailsService,
  updateProductStatusService,
};
