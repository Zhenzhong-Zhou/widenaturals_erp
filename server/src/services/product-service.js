const {
  getPaginatedProducts,
  getProductDetailsById,
  updateProductStatus,
  updateProductInfo, insertProductsBulk,
} = require('../repositories/product-repository');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  transformPaginatedProductResults,
  transformProductDetail, transformProductList
} = require('../transformers/product-transformer');
const { withTransaction, lockRow } = require('../database/db');
const { checkStatusExists } = require('../repositories/status-repository');
const { assertValidProductStatusTransition, filterUpdatableProductFields, validateProductListBusiness,
  prepareProductInsertPayloads
} = require('../business/product-business');

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

/**
 * Service: Update Product Information
 *
 * Performs a transactional update of editable product fields (excluding status),
 * ensuring concurrency protection, field-level validation, and structured audit logging.
 * Intended for internal ERP/admin workflows that modify product metadata safely.
 *
 * ### Flow
 * 1. Begin transaction and lock the product row (`FOR UPDATE`).
 * 2. Validate existence and filter update payload via business rules.
 * 3. Apply validated updates and record audit metadata.
 * 4. Commit transaction and return a standardized success response.
 *
 * @param {Object} options
 * @param {string} options.productId - Product UUID to update.
 * @param {Object} options.updates - Key/value pairs of product fields to update (excluding status).
 * @param {{ id: string }} options.user - Authenticated user performing the action.
 *
 * @returns {Promise<{ id: string, success: boolean }>} Update confirmation payload.
 *
 * @throws {AppError.notFoundError} If the product does not exist.
 * @throws {AppError.validationError} If no valid update fields are provided.
 * @throws {AppError.conflictError} If concurrent modification is detected.
 * @throws {AppError.databaseError} If a database failure occurs.
 */
const updateProductInfoService = async ({ productId, updates, user }) => {
  return withTransaction(async (client) => {
    const userId = user.id;
    
    // Step 1: Lock product row to prevent concurrent edits
    const product = await lockRow(client, 'products', productId, 'FOR UPDATE', {
      context: 'product-service/updateProductInfoService',
    });
    
    if (!product) {
      throw AppError.notFoundError('Product not found.');
    }
    
    // Step 2: Validate and filter allowed fields (handled by business layer)
    const filteredUpdates = filterUpdatableProductFields(updates);
    
    // Step 3: Perform update atomically
    const updated = await updateProductInfo(productId, filteredUpdates, userId, client);
    
    if (!updated) {
      throw AppError.conflictError(
        'Concurrent update detected — product information not updated.'
      );
    }
    
    // Step 4: Log success for audit trace
    logSystemInfo('Product information updated successfully', {
      context: 'product-service/updateProductInfoService',
      productId,
      updatedFields: Object.keys(filteredUpdates),
      userId,
    });
    
    // Step 5: Return standardized success payload
    return updated;
  });
};

/**
 * @async
 * @function
 * @description
 * Creates multiple products in a single atomic operation.
 *
 * This service orchestrates high-level creation logic by:
 *   - Running business-layer validation (`validateProductListBusiness`)
 *   - Normalizing product fields (`prepareProductInsertPayloads`)
 *   - Delegating database write operations to the repository (`insertProductsBulk`)
 *
 * Transaction Notes:
 *   - The entire bulk creation runs inside a single database transaction
 *     via `withTransaction` to guarantee atomicity.
 *   - If any product fails validation or insertion, the transaction rolls back,
 *     preventing partial product creation and preserving data integrity.
 *   - This behavior aligns with other ERP modules (SKUs, inventory, pricing)
 *     for predictable error handling and audit consistency.
 *
 * Logging:
 *   - Emits structured system logs for auditing and performance insights.
 *
 * @param {Array<Object>} productList
 *   Array of raw product definitions validated by Joi at the route layer.
 *
 * @param {Object} user
 *   Authenticated user context used for audit fields (`created_by`).
 *
 * @returns {Promise<Array>}
 *   A normalized list of inserted product records transformed by transformProductList.
 *
 * @throws {AppError}
 *   Throws domain-level errors wrapped in AppError when validation or database
 *   operations fail.
 */
const createProductsService = async (productList, user) => {
  const context = 'product-service/createProductsService';
  const userId = user.id;
  const startTime = Date.now();
  
  return withTransaction(async (client) => {
    try {
      // ---------------------------
      // 1. Business validation
      // ---------------------------
      validateProductListBusiness(productList);
      
      // ---------------------------
      // 2. Prepare normalized insert payloads
      // ---------------------------
      const insertPayloads = prepareProductInsertPayloads(productList, userId);
      
      // ---------------------------
      // 3. Insert in bulk
      // ---------------------------
      const inserted = await insertProductsBulk(insertPayloads, client);
      
      // ---------------------------
      // 4. Logging
      // ---------------------------
      logSystemInfo('Bulk product creation completed', {
        context,
        inputCount: productList.length,
        insertedCount: inserted.length,
        elapsedMs: Date.now() - startTime,
      });
      
      return transformProductList(inserted);
    } catch (error) {
      logSystemException(error, 'Failed to create products in bulk', { context });
      
      throw AppError.databaseError('Failed to create products.', {
        cause: error,
        context,
      });
    }
  });
};

module.exports = {
  fetchPaginatedProductsService,
  fetchProductDetailsService,
  updateProductStatusService,
  updateProductInfoService,
  createProductsService,
};
