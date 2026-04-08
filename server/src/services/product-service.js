/**
 * @file product-service.js
 * @description Business logic for product retrieval, creation, and mutation.
 *
 * Exports:
 *   - fetchPaginatedProductsService   – paginated product list with filtering and sorting
 *   - fetchProductDetailsService      – single product detail by ID
 *   - updateProductStatusService      – updates product status with FSM validation
 *   - updateProductInfoService        – updates allowed product info fields
 *   - createProductsService           – bulk product creation
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  getPaginatedProducts,
  getProductDetailsById,
  updateProductStatus,
  updateProductInfo,
  insertProductsBulk,
}                                      = require('../repositories/product-repository');
const AppError                         = require('../utils/AppError');
const {
  transformPaginatedProductResults,
  transformProductDetail,
  transformProductList,
}                                      = require('../transformers/product-transformer');
const { withTransaction }     = require('../database/db');
const { lockRow } = require('../utils/db/lock-modes');
const { checkStatusExists }            = require('../repositories/status-repository');
const {
  assertValidProductStatusTransition,
  filterUpdatableProductFields,
  validateProductList,
  prepareProductInsertPayloads,
}                                      = require('../business/product-business');

const CONTEXT = 'product-service';

/**
 * Fetches paginated product records with optional filtering and sorting.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]           - Field filters to apply.
 * @param {number}        [options.page=1]               - Page number (1-based).
 * @param {number}        [options.limit=10]             - Records per page.
 * @param {string}        [options.sortBy='createdAt']   - Sort field key.
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']     - Sort direction.
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedProductsService = async ({
                                               filters   = {},
                                               page      = 1,
                                               limit     = 10,
                                               sortBy    = 'createdAt',
                                               sortOrder = 'DESC',
                                             }) => {
  const context = `${CONTEXT}/fetchPaginatedProductsService`;
  
  try {
    const rawResult = await getPaginatedProducts({ filters, page, limit, sortBy, sortOrder });
    
    if (!rawResult || rawResult.data.length === 0) {
      return {
        data:       [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    return transformPaginatedProductResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch products.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches a single product record by ID.
 *
 * @param {string} productId - UUID of the product to retrieve.
 * @returns {Promise<ProductDetailRecord>}
 *
 * @throws {AppError} `notFoundError`  – product does not exist.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchProductDetailsService = async (productId) => {
  const context = `${CONTEXT}/fetchProductDetailsService`;
  
  try {
    const rawProduct = await getProductDetailsById(productId);
    
    if (!rawProduct) {
      throw AppError.notFoundError('Product not found.');
    }
    
    return transformProductDetail(rawProduct);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch product details.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Updates the status of a product with FSM transition validation.
 *
 * Locks the product row, validates the target status exists, checks the
 * current status is different, and applies business rule validation.
 *
 * @param {Object} options
 * @param {string} options.productId - UUID of the product to update.
 * @param {string} options.statusId  - UUID of the new status.
 * @param {Object} options.user      - Authenticated user.
 * @returns {Promise<Object>} Updated product row.
 *
 * @throws {AppError} `validationError`  – invalid status or already in this status.
 * @throws {AppError} `conflictError`    – concurrent update detected.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateProductStatusService = async ({ productId, statusId, user }) => {
  const context = `${CONTEXT}/updateProductStatusService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // 1. Lock product row before reads.
      const product = await lockRow(client, 'products', productId, 'FOR UPDATE', { context });
      
      // 2. Validate target status exists.
      const statusExists = await checkStatusExists(statusId, client);
      if (!statusExists) {
        throw AppError.validationError('Invalid or inactive status ID.');
      }
      
      // 3. Guard against no-op updates.
      if (product.status_id === statusId) {
        throw AppError.validationError('Product is already in this status.');
      }
      
      // 4. Apply FSM business rule validation.
      assertValidProductStatusTransition(product.status_id, statusId);
      
      // 5. Persist status update.
      const updated = await updateProductStatus(productId, statusId, userId, client);
      
      if (!updated) {
        throw AppError.conflictError('Concurrent update detected — product status not updated.');
      }
      
      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to update product status.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Updates allowed product info fields atomically.
 *
 * Locks the product row and applies only the fields permitted by the business layer.
 *
 * @param {Object} options
 * @param {string} options.productId - UUID of the product to update.
 * @param {Object} options.updates   - Fields to update.
 * @param {Object} options.user      - Authenticated user.
 * @returns {Promise<Object>} Updated product row.
 *
 * @throws {AppError} `notFoundError`  – product does not exist.
 * @throws {AppError} `conflictError`  – concurrent update detected.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateProductInfoService = async ({ productId, updates, user }) => {
  const context = `${CONTEXT}/updateProductInfoService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // 1. Lock product row to prevent concurrent edits.
      const product = await lockRow(client, 'products', productId, 'FOR UPDATE', { context });
      
      if (!product) {
        throw AppError.notFoundError('Product not found.');
      }
      
      // 2. Filter to only permitted fields.
      const filteredUpdates = filterUpdatableProductFields(updates);
      
      // 3. Persist update atomically.
      const updated = await updateProductInfo(productId, filteredUpdates, userId, client);
      
      if (!updated) {
        throw AppError.conflictError('Concurrent update detected — product information not updated.');
      }
      
      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to update product information.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Creates products in bulk with business validation and normalized payloads.
 *
 * @param {Array<Object>} productList - Product input objects to insert.
 * @param {Object}        user        - Authenticated user.
 * @returns {Promise<ProductInsertRecord[]>} ID-only insert results.
 *
 * @throws {AppError} Re-throws AppErrors from business validation unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createProductsService = async (productList, user) => {
  const context = `${CONTEXT}/createProductsService`;
  
  try {
    return await withTransaction(async (client) => {
      // 1. Validate product list against business rules.
      validateProductList(productList);
      
      // 2. Prepare normalised insert payloads.
      const insertPayloads = prepareProductInsertPayloads(productList, user.id);
      
      // 3. Insert in bulk and transform results.
      const inserted = await insertProductsBulk(insertPayloads, client);
      
      return transformProductList(inserted);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to create products.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  fetchPaginatedProductsService,
  fetchProductDetailsService,
  updateProductStatusService,
  updateProductInfoService,
  createProductsService,
};
