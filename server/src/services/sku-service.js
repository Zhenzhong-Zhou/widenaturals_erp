/**
 * @file sku-service.js
 * @description Business logic for SKU retrieval, creation, mutation, and access-controlled DTO composition.
 *
 * This service coordinates repository calls, ACL enforcement, transactional
 * updates, SKU code generation, related-record loading, and response shaping.
 * It does not perform request validation or response formatting; controllers
 * and middleware own those layers.
 *
 * Exports:
 *   - fetchPaginatedSkuProductCardsService – paginated SKU product card list with ACL-scoped filters
 *   - fetchPaginatedSkusService            – paginated SKU table list with resolved primary images
 *   - fetchSkuDetailsService               – full SKU detail with access-controlled related data
 *   - createSkusService                    – bulk SKU creation with code generation and duplicate checks
 *   - updateSkuMetadataService             – updates SKU metadata fields
 *   - updateSkuStatusService               – updates SKU status with FSM validation
 *   - updateSkuDimensionsService           – updates SKU dimension fields
 *   - updateSkuIdentityService             – updates SKU identity fields
 *
 * Error handling follows the single-log principle:
 *   - Expected AppErrors from lower layers are re-thrown unchanged.
 *   - Unexpected errors are wrapped as AppError.serviceError and allowed to
 *     bubble to globalErrorHandler, which logs once with the normalized shape.
 */

'use strict';

const { getStatusId } = require('../config/status-cache');
const {
  getPaginatedSkuProductCards,
  insertSkusBulk,
  checkSkusExistBulk,
  updateSkuStatus,
  getPaginatedSkus,
  getSkuDetailsById,
  checkBarcodesExistBulk,
  updateSkuMetadata,
  updateSkuDimensions,
  updateSkuIdentity,
} = require('../repositories/sku-repository');
const {
  transformPaginatedSkuProductCardResult,
  transformSkuRecord,
  transformPaginatedSkuListResults,
  transformSkuDetail,
} = require('../transformers/sku-transformer');
const AppError = require('../utils/AppError');
const {
  validateSkuList,
  prepareSkuInsertPayloads,
  assertValidSkuStatusTransition,
  evaluateSkuStatusAccessControl,
  sliceSkuForUser,
  applySkuProductCardVisibilityRules,
  assertSkuEditAllowed,
  resolveSkuImageUrls,
  resolveSkuPrimaryImageUrls,
} = require('../business/sku-business');
const { withTransaction } = require('../database/db');
const { lockRows, lockRow } = require('../utils/db/lock-modes');
const { getOrCreateBaseCodesBulk } = require('./sku-code-base-service');
const { generateSKU } = require('../utils/sku-generator');
const { checkStatusExists } = require('../repositories/status-repository');
const { getSkuImagesBySkuId } = require('../repositories/sku-image-repository');
const { getPricingBySkuId } = require('../repositories/pricing-repository');
const {
  getComplianceBySkuId,
} = require('../repositories/compliance-record-repository');
const {
  evaluateComplianceViewAccessControl,
  sliceComplianceRecordsForUser,
} = require('../business/compliance-record-business');
const {
  evaluateSkuImageViewAccessControl,
  sliceSkuImagesForUser,
} = require('../business/sku-image-buiness');
const {
  evaluatePricingViewAccessControl,
  slicePricingForUser,
} = require('../business/pricing-business');
const { SKU_EDIT_TYPE } = require('../utils/constants/domain/sku-constants');
const { resolveImageUrlsOnItems } = require('../utils/aws-s3-service');

const CONTEXT = 'sku-service';

/**
 * Fetches paginated SKU product cards with ACL-scoped filter enforcement.
 *
 * Evaluates the user's SKU visibility scope, applies ACL rules to the filters
 * before querying, fetches paginated product-card rows, transforms the page
 * result, and resolves image keys to public URLs.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Field filters to apply before ACL adjustment.
 * @param {number} [options.page=1] - Page number, 1-based.
 * @param {number} [options.limit=10] - Records per page.
 * @param {string} [options.sortBy] - Sort field key.
 * @param {'ASC'|'DESC'} [options.sortOrder] - Sort direction.
 * @param {Object} options.user - Authenticated user used for ACL evaluation.
 * @returns {Promise<PaginatedResult<Object>>} Paginated SKU product-card DTO with resolved image URLs.
 *
 * @throws {AppError} Re-throws expected AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedSkuProductCardsService = async ({
  filters = {},
  page = 1,
  limit = 10,
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
    
    const transformed = await transformPaginatedSkuProductCardResult(rawResult);
    return resolveSkuImageUrls(transformed);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to fetch SKU product cards.', {
      context,
      meta: { error: error.message },
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
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
}) => {
  const context = `${CONTEXT}/fetchPaginatedSkusService`;

  try {
    const rawResult = await getPaginatedSkus({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    if (!rawResult || rawResult.data.length === 0) {
      return {
        data: [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    const transformed = await transformPaginatedSkuListResults(rawResult);
    return resolveSkuPrimaryImageUrls(transformed);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to fetch SKU records.', {
      context,
      meta: { error: error.message },
    });
  }
};

/**
 * Fetches a full SKU detail DTO with access-controlled related records.
 *
 * Retrieves the base SKU record, applies SKU-level visibility rules, resolves
 * permitted image keys to public URLs, and conditionally includes pricing and
 * compliance records based on the user's resolved ACL.
 *
 * @param {string} skuId - UUID of the SKU to retrieve.
 * @param {Object} user - Authenticated user.
 * @returns {Promise<Object>} Access-controlled SKU detail DTO.
 *
 * @throws {AppError} `notFoundError` when the SKU does not exist.
 * @throws {AppError} `authorizationError` when the user cannot view this SKU.
 * @throws {AppError} Re-throws expected AppErrors from lower layers unchanged.
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
    const safeSku = sliceSkuForUser(skuRow, skuAccess);

    if (!safeSku) {
      throw AppError.authorizationError(
        'You do not have permission to view this SKU.'
      );
    }

    // 3. Fetch and filter images.
    const imageAccess = await evaluateSkuImageViewAccessControl(user);
    const imagesRaw = await getSkuImagesBySkuId(skuId);
    const safeImages = sliceSkuImagesForUser(imagesRaw, imageAccess);
    const resolvedImages = await resolveImageUrlsOnItems(safeImages, ['imageUrl']);

    // 4. Fetch and filter pricing (optional — gated by access).
    const pricingAccess = await evaluatePricingViewAccessControl(user);
    let safePricingRows = [];

    if (pricingAccess.canViewAllValidPricing) {
      const pricingRows = await getPricingBySkuId(skuId);
      safePricingRows = slicePricingForUser(pricingRows, pricingAccess);
    }

    // 5. Fetch and filter compliance records (optional — gated by access).
    const complianceAccess = await evaluateComplianceViewAccessControl(user);
    let safeComplianceRecords = [];

    if (complianceAccess.canViewCompliance) {
      const complianceRows = await getComplianceBySkuId(skuId);
      safeComplianceRecords = sliceComplianceRecordsForUser(
        complianceRows,
        complianceAccess
      );
    }

    // 6. Build final response DTO.
    return transformSkuDetail({
      sku: safeSku,
      images: resolvedImages,
      pricing: safePricingRows,
      complianceRecords: safeComplianceRecords,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch SKU detail.', {
      context,
      meta: { error: error.message },
    });
  }
};

/**
 * Creates SKUs in bulk with SKU-code generation and duplicate validation.
 *
 * Validates input, locks related product rows, resolves or creates SKU base
 * codes, generates SKU codes sequentially, checks SKU and barcode conflicts,
 * inserts the new SKUs with the initial inactive status, and returns transformed
 * SKU records.
 *
 * @param {Array<Object>} skuList - Validated SKU creation input objects.
 * @param {Object} user - Authenticated user creating the SKUs.
 * @returns {Promise<Object[]>} Transformed created SKU records.
 *
 * @throws {AppError} `validationError` for empty input or business rule failure.
 * @throws {AppError} `notFoundError` when no matching products are found to lock.
 * @throws {AppError} `conflictError` when generated SKUs or barcodes already exist.
 * @throws {AppError} Re-throws expected AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createSkusService = async (skuList, user) => {
  const context = `${CONTEXT}/createSkusService`;
  
  try {
    // Pure input validation — outside the transaction (point 5).
    if (!Array.isArray(skuList) || skuList.length === 0) {
      throw AppError.validationError('No SKUs provided for creation.');
    }
    validateSkuList(skuList);
    
    const userId = user.id;
    const activeStatusId = getStatusId('general_active');
    const inactiveStatusId = getStatusId('general_inactive');
    
    return await withTransaction(async (client) => {
      const lastUsedCodeMap = new Map();
      
      // 1. Lock all related product rows.
      const uniqueProductIds = [...new Set(skuList.map((s) => s.product_id))];
      const lockedProducts = await lockRows(
        client,
        'products',
        uniqueProductIds,
        'FOR UPDATE',
        { context }
      );
      
      if (!lockedProducts?.length) {
        throw AppError.notFoundError('No matching products found to lock.');
      }
      
      // 2. Resolve or create base codes for all brand/category pairs.
      const basePairs = skuList.map((s) => ({
        brandCode: s.brand_code,
        categoryCode: s.category_code,
        statusId: activeStatusId,
        userId,
      }));
      await getOrCreateBaseCodesBulk(basePairs, client);
      
      // 3. Generate SKU codes — sequential by necessity (lastUsedCodeMap mutates per iteration).
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
      
      // 4. Bulk duplicate pre-check.
      const skuConflicts = await checkSkusExistBulk(
        generatedSkus.map((sku, i) => ({ sku, productId: skuList[i].product_id })),
        client
      );
      if (skuConflicts.length) {
        throw AppError.conflictError(
          `SKU(s) already exist: ${skuConflicts.join(', ')}`
        );
      }
      
      const barcodes = skuList.map((s) => s.barcode).filter(Boolean);
      if (barcodes.length) {
        const barcodeConflicts = await checkBarcodesExistBulk(barcodes, client);
        if (barcodeConflicts.length) {
          throw AppError.conflictError(
            `Barcode(s) already in use: ${barcodeConflicts.join(', ')}`
          );
        }
      }
      
      // 5. Prepare → validate → insert.
      const insertPayloads = prepareSkuInsertPayloads(
        skuList,
        generatedSkus,
        inactiveStatusId,
        userId
      );
      
      const insertedSkus = await insertSkusBulk(insertPayloads, client);
      
      return transformSkuRecord(insertedSkus, generatedSkus);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to create SKUs.', {
      context,
      meta: { error: error.message },
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

      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', {
        context,
      });
      if (!sku) throw AppError.notFoundError('SKU not found.');

      await assertSkuEditAllowed(sku, SKU_EDIT_TYPE.METADATA, user, client);

      const updated = await updateSkuMetadata(skuId, payload, userId, client);
      if (!updated)
        throw AppError.conflictError(
          'Concurrent update detected — SKU metadata not updated.'
        );

      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to update SKU metadata.', {
      context,
      meta: { error: error.message },
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

      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', {
        context,
      });
      if (!sku) throw AppError.notFoundError('SKU not found.');

      const statusExists = await checkStatusExists(statusId, client);
      if (!statusExists)
        throw AppError.validationError('Invalid or inactive status ID.');

      if (sku.status_id === statusId)
        throw AppError.validationError('SKU is already in this status.');

      assertValidSkuStatusTransition(sku.status_id, statusId);

      const updated = await updateSkuStatus(skuId, statusId, userId, client);
      if (!updated)
        throw AppError.conflictError(
          'Concurrent update detected — SKU status not updated.'
        );

      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to update SKU status.', {
      context,
      meta: { error: error.message },
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

      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', {
        context,
      });
      if (!sku) throw AppError.notFoundError('SKU not found.');

      await assertSkuEditAllowed(sku, SKU_EDIT_TYPE.DIMENSIONS, user, client);

      const updated = await updateSkuDimensions(skuId, payload, userId, client);
      if (!updated)
        throw AppError.conflictError(
          'Concurrent update detected — SKU dimensions not updated.'
        );

      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to update SKU dimensions.', {
      context,
      meta: { error: error.message },
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

      const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', {
        context,
      });
      if (!sku) throw AppError.notFoundError('SKU not found.');

      await assertSkuEditAllowed(sku, SKU_EDIT_TYPE.IDENTITY, user, client);

      const updated = await updateSkuIdentity(skuId, payload, userId, client);
      if (!updated)
        throw AppError.conflictError(
          'Concurrent update detected — SKU identity not updated.'
        );

      return updated;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to update SKU identity.', {
      context,
      meta: { error: error.message },
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
