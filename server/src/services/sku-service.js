/**
 * @file sku-service.js
 * @description Business logic for SKU retrieval, creation, and mutation.
 *
 * Exports:
 *   - fetchPaginatedSkuProductCardsService – paginated SKU product card list
 *   - fetchPaginatedSkusService            – paginated SKU table list
 *   - fetchSkuDetailsService               – full SKU detail with related data
 *   - createSkusService                    – bulk SKU creation with code generation
 *   - updateSkuMetadataService             – updates SKU metadata fields
 *   - updateSkuStatusService               – updates SKU status with FSM validation
 *   - updateSkuDimensionsService           – updates SKU dimension fields
 *   - updateSkuIdentityService             – updates SKU identity fields
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { getStatusId }                    = require('../config/status-cache');
const {
  getPaginatedSkuProductCards,
  insertSkusBulk,
  checkSkuExists,
  updateSkuStatus,
  getPaginatedSkus,
  getSkuDetailsById,
  checkBarcodeExists,
  updateSkuMetadata,
  updateSkuDimensions,
  updateSkuIdentity,
}                                        = require('../repositories/sku-repository');
const {
  transformPaginatedSkuProductCardResult,
  transformSkuRecord,
  transformPaginatedSkuListResults,
  transformSkuDetail,
}                                        = require('../transformers/sku-transformer');
const AppError                           = require('../utils/AppError');
const {
  validateSkuList,
  prepareSkuInsertPayloads,
  assertValidSkuStatusTransition,
  evaluateSkuStatusAccessControl,
  sliceSkuForUser,
  applySkuProductCardVisibilityRules,
  assertSkuEditAllowed,
}                                        = require('../business/sku-business');
const { withTransaction } = require('../database/db');
const { lockRows, lockRow } = require('../utils/db/lock-modes');
const { getOrCreateBaseCodesBulk }       = require('./sku-code-base-service');
const { generateSKU }                    = require('../utils/sku-generator');
const { checkStatusExists }              = require('../repositories/status-repository');
const { getSkuImagesBySkuId }            = require('../repositories/sku-image-repository');
const { getPricingBySkuId }              = require('../repositories/pricing-repository');
const { getComplianceBySkuId }           = require('../repositories/compliance-record-repository');
const {
  evaluateComplianceViewAccessControl,
  sliceComplianceRecordsForUser,
}                                        = require('../business/compliance-record-business');
const {
  evaluateSkuImageViewAccessControl,
  sliceSkuImagesForUser,
}                                        = require('../business/sku-image-buiness');
const {
  evaluatePricingViewAccessControl,
  slicePricingForUser,
}                                        = require('../business/pricing-business');
const { SKU_EDIT_TYPE }                  = require('../utils/constants/domain/sku-constants');

const CONTEXT = 'sku-service';

/**
 * Fetches paginated SKU product cards with ACL-scoped filter enforcement.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]  - Field filters to apply.
 * @param {number}        [options.page=1]      - Page number (1-based).
 * @param {number}        [options.limit=10]    - Records per page.
 * @param {string}        [options.sortBy]      - Sort field key.
 * @param {'ASC'|'DESC'}  [options.sortOrder]   - Sort direction.
 * @param {Object}        options.user          - Authenticated user.
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedSkuProductCardsService = async ({
                                                      filters   = {},
                                                      page      = 1,
                                                      limit     = 10,
                                                      sortBy,
                                                      sortOrder,
                                                      user,
                                                    }) => {
  const context = `${CONTEXT}/fetchPaginatedSkuProductCardsService`;
  
  try {
    // 1. Evaluate ACL — determines which statuses the user can see.
    const acl = await evaluateSkuStatusAccessControl(user);
    
    // 2. Apply ACL to filters before SQL (CRITICAL).
    const adjustedFilters = applySkuProductCardVisibilityRules(filters, acl);
    
    // 3. Execute repository query.
    const rawResult = await getPaginatedSkuProductCards({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: adjustedFilters,
    });
    
    return transformPaginatedSkuProductCardResult(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch SKU product cards.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches paginated SKU records with optional filtering and sorting.
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
const fetchPaginatedSkusService = async ({
                                           filters   = {},
                                           page      = 1,
                                           limit     = 10,
                                           sortBy    = 'createdAt',
                                           sortOrder = 'DESC',
                                         }) => {
  const context = `${CONTEXT}/fetchPaginatedSkusService`;
  
  try {
    const rawResult = await getPaginatedSkus({ filters, page, limit, sortBy, sortOrder });
    
    if (!rawResult || rawResult.data.length === 0) {
      return {
        data:       [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    return transformPaginatedSkuListResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch SKU records.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches full SKU detail with images, pricing, and compliance records,
 * each filtered by the user's access scope.
 *
 * @param {string} skuId - UUID of the SKU to retrieve.
 * @param {Object} user  - Authenticated user.
 * @returns {Promise<Object>} Transformed SKU detail DTO.
 *
 * @throws {AppError} `notFoundError`      – SKU does not exist.
 * @throws {AppError} `authorizationError` – user cannot view this SKU.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchSkuDetailsService = async (skuId, user) => {
  const context = `${CONTEXT}/fetchSkuDetailsService`;
  
  try {
    // 1. Fetch base SKU record.
    const skuRow = await getSkuDetailsById(skuId);
    
    if (!skuRow) {
      throw AppError.notFoundError(`SKU not found: ${skuId}`);
    }
    
    // 2. Apply SKU-level visibility rules.
    const skuAccess = await evaluateSkuStatusAccessControl(user);
    const safeSku   = sliceSkuForUser(skuRow, skuAccess);
    
    if (!safeSku) {
      throw AppError.authorizationError('You do not have permission to view this SKU.');
    }
    
    // 3. Fetch and filter images.
    const imageAccess = await evaluateSkuImageViewAccessControl(user);
    const imagesRaw   = await getSkuImagesBySkuId(skuId);
    const safeImages  = sliceSkuImagesForUser(imagesRaw, imageAccess);
    
    // 4. Fetch and filter pricing (optional — gated by access).
    const pricingAccess = await evaluatePricingViewAccessControl(user);
    let safePricing     = [];
    
    if (pricingAccess.canViewPricing) {
      const pricingRows = await getPricingBySkuId(skuId);
      safePricing       = slicePricingForUser(pricingRows, pricingAccess);
    }
    
    // 5. Fetch and filter compliance records (optional — gated by access).
    const complianceAccess    = await evaluateComplianceViewAccessControl(user);
    let safeComplianceRecords = [];
    
    if (complianceAccess.canViewCompliance) {
      const complianceRows      = await getComplianceBySkuId(skuId);
      safeComplianceRecords     = sliceComplianceRecordsForUser(complianceRows, complianceAccess);
    }
    
    // 6. Build final response DTO.
    return transformSkuDetail({
      sku:               safeSku,
      images:            safeImages,
      pricing:           safePricing,
      complianceRecords: safeComplianceRecords,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch SKU detail.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Creates SKUs in bulk with code generation and duplicate validation.
 *
 * Validates input, locks product rows, resolves base codes, generates SKU codes,
 * checks for duplicates, and inserts in bulk.
 *
 * @param {Array<Object>} skuList - SKU input objects.
 * @param {Object}        user    - Authenticated user.
 * @returns {Promise<SkuInsertRecord[]>}
 *
 * @throws {AppError} `validationError`  – empty input or business rule failure.
 * @throws {AppError} `notFoundError`    – no matching products found to lock.
 * @throws {AppError} `conflictError`    – SKU or barcode already exists.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createSkusService = async (skuList, user) => {
  const context = `${CONTEXT}/createSkusService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId         = user.id;
      const lastUsedCodeMap = new Map();
      
      if (!Array.isArray(skuList) || skuList.length === 0) {
        throw AppError.validationError('No SKUs provided for creation.');
      }
      
      validateSkuList(skuList);
      
      const activeStatusId   = getStatusId('general_active');
      const inactiveStatusId = getStatusId('general_inactive');
      
      // 1. Lock all related product rows.
      const uniqueProductIds = [...new Set(skuList.map((s) => s.product_id))];
      const lockedProducts   = await lockRows(client, 'products', uniqueProductIds, 'FOR UPDATE', { context });
      
      if (!lockedProducts?.length) {
        throw AppError.notFoundError('No matching products found to lock.');
      }
      
      // 2. Resolve or create base codes for all brand/category pairs.
      const basePairs = skuList.map((s) => ({
        brandCode:    s.brand_code,
        categoryCode: s.category_code,
        statusId:     activeStatusId,
        userId,
      }));
      
      await getOrCreateBaseCodesBulk(basePairs, client);
      
      // 3. Generate SKU codes — uses lastUsedCodeMap to minimise DB lookups.
      const generatedSkus = [];
      for (const s of skuList) {
        const skuCode = await generateSKU(
          s.brand_code,
          s.category_code,
          s.variant_code,
          s.region_code,
          lastUsedCodeMap,
          client
        );
        generatedSkus.push(skuCode);
      }
      
      // 4. Pre-check for duplicates before insertion.
      for (let i = 0; i < skuList.length; i++) {
        const s = skuList[i];
        
        const exists = await checkSkuExists(generatedSkus[i], s.product_id, client);
        if (exists) {
          throw AppError.conflictError(`SKU already exists: ${generatedSkus[i]}`);
        }
        
        if (s.barcode) {
          const barcodeExists = await checkBarcodeExists(s.barcode, client);
          if (barcodeExists) {
            throw AppError.conflictError(`Barcode already in use: ${s.barcode}`);
          }
        }
      }
      
      // 5. Prepare and insert in bulk.
      const insertPayloads = prepareSkuInsertPayloads(skuList, generatedSkus, inactiveStatusId, userId);
      const insertedSkus   = await insertSkusBulk(insertPayloads, client);
      
      return transformSkuRecord(insertedSkus, generatedSkus);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to create SKUs.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Updates SKU metadata fields atomically.
 *
 * @param {Object} options
 * @param {string} options.skuId   - UUID of the SKU to update.
 * @param {Object} options.payload - Metadata fields to update.
 * @param {Object} options.user    - Authenticated user.
 * @returns {Promise<Object>} Updated SKU row.
 *
 * @throws {AppError} `notFoundError`  – SKU not found.
 * @throws {AppError} `conflictError`  – concurrent update detected.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateSkuMetadataService = async ({ skuId, payload, user }) => {
  const context = `${CONTEXT}/updateSkuMetadataService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context });
      if (!sku) throw AppError.notFoundError('SKU not found.');
      
      await assertSkuEditAllowed(sku, SKU_EDIT_TYPE.METADATA, user, client);
      
      const updated = await updateSkuMetadata(skuId, payload, userId, client);
      if (!updated) throw AppError.conflictError('Concurrent update detected — SKU metadata not updated.');
      
      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to update SKU metadata.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Updates SKU status with FSM transition validation.
 *
 * @param {Object} options
 * @param {string} options.skuId    - UUID of the SKU to update.
 * @param {string} options.statusId - New status UUID.
 * @param {Object} options.user     - Authenticated user.
 * @returns {Promise<Object>} Updated SKU row.
 *
 * @throws {AppError} `notFoundError`   – SKU not found or invalid status.
 * @throws {AppError} `validationError` – invalid status or no-op.
 * @throws {AppError} `conflictError`   – concurrent update detected.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateSkuStatusService = async ({ skuId, statusId, user }) => {
  const context = `${CONTEXT}/updateSkuStatusService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context });
      if (!sku) throw AppError.notFoundError('SKU not found.');
      
      const statusExists = await checkStatusExists(statusId, client);
      if (!statusExists) throw AppError.validationError('Invalid or inactive status ID.');
      
      if (sku.status_id === statusId) throw AppError.validationError('SKU is already in this status.');
      
      assertValidSkuStatusTransition(sku.status_id, statusId);
      
      const updated = await updateSkuStatus(skuId, statusId, userId, client);
      if (!updated) throw AppError.conflictError('Concurrent update detected — SKU status not updated.');
      
      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to update SKU status.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Updates SKU dimension fields atomically.
 *
 * @param {Object} options
 * @param {string} options.skuId   - UUID of the SKU to update.
 * @param {Object} options.payload - Dimension fields to update.
 * @param {Object} options.user    - Authenticated user.
 * @returns {Promise<Object>} Updated SKU row.
 *
 * @throws {AppError} `notFoundError` – SKU not found.
 * @throws {AppError} `conflictError` – concurrent update detected.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateSkuDimensionsService = async ({ skuId, payload, user }) => {
  const context = `${CONTEXT}/updateSkuDimensionsService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context });
      if (!sku) throw AppError.notFoundError('SKU not found.');
      
      await assertSkuEditAllowed(sku, SKU_EDIT_TYPE.DIMENSIONS, user, client);
      
      const updated = await updateSkuDimensions(skuId, payload, userId, client);
      if (!updated) throw AppError.conflictError('Concurrent update detected — SKU dimensions not updated.');
      
      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to update SKU dimensions.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Updates SKU identity fields atomically.
 *
 * @param {Object} options
 * @param {string} options.skuId   - UUID of the SKU to update.
 * @param {Object} options.payload - Identity fields to update.
 * @param {Object} options.user    - Authenticated user.
 * @returns {Promise<Object>} Updated SKU row.
 *
 * @throws {AppError} `notFoundError` – SKU not found.
 * @throws {AppError} `conflictError` – concurrent update detected.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateSkuIdentityService = async ({ skuId, payload, user }) => {
  const context = `${CONTEXT}/updateSkuIdentityService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context });
      if (!sku) throw AppError.notFoundError('SKU not found.');
      
      await assertSkuEditAllowed(sku, SKU_EDIT_TYPE.IDENTITY, user, client);
      
      const updated = await updateSkuIdentity(skuId, payload, userId, client);
      if (!updated) throw AppError.conflictError('Concurrent update detected — SKU identity not updated.');
      
      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to update SKU identity.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  fetchPaginatedSkuProductCardsService,
  fetchPaginatedSkusService,
  fetchSkuDetailsService,
  createSkusService,
  updateSkuMetadataService,
  updateSkuStatusService,
  updateSkuDimensionsService,
  updateSkuIdentityService,
};
