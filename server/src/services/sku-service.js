const { getStatusId } = require('../config/status-cache');
const {
  fetchPaginatedActiveSkusWithProductCards,
  insertSkusBulk,
  checkSkuExists,
  updateSkuStatus,
  getPaginatedSkus,
  getSkuDetailsById,
} = require('../repositories/sku-repository');
const {
  transformPaginatedSkuProductCardResult,
  transformSkuRecord,
  transformPaginatedSkuListResults,
  transformSkuDetail,
} = require('../transformers/sku-transformer');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const { sanitizeSortBy } = require('../utils/sort-utils');
const {
  validateSkuListBusiness,
  prepareSkuInsertPayloads,
  assertValidSkuStatusTransition,
  evaluateSkuStatusAccessControl,
  sliceSkuForUser,
} = require('../business/sku-business');
const { withTransaction, lockRows, lockRow } = require('../database/db');
const { getOrCreateBaseCodesBulk } = require('./sku-code-base-service');
const { generateSKU } = require('../utils/sku-generator');
const { checkStatusExists } = require('../repositories/status-repository');
const { getSkuImagesBySkuId } = require('../repositories/sku-image-repository');
const { getPricingBySkuId } = require('../repositories/pricing-repository');
const { getComplianceBySkuId } = require('../repositories/compliance-record-repository');
const { evaluateComplianceViewAccessControl, sliceComplianceRecordsForUser } = require('../business/compliance-record-business');
const { evaluateSkuImageViewAccessControl, sliceSkuImagesForUser } = require('../business/sku-image-buiness');
const { evaluatePricingViewAccessControl, slicePricingForUser } = require('../business/pricing-business');

/**
 * Service to fetch a paginated list of active SKU product cards.
 *
 * Filters by active product and active SKU status.
 * Supports filtering by brand, category, market region, size label, and keyword.
 * Accepts optional sorting.
 *
 * @param {Object} options - Pagination, sorting, and filter options.
 * @param {number} options.page - Current page number (1-based).
 * @param {number} options.limit - Number of results per page.
 * @param {string} [options.sortBy] - Comma-separated sort keys (e.g., "name,created_at").
 * @param {string} [options.sortOrder='DESC'] - Sort direction ('ASC' or 'DESC').
 * @param {Object} [options.filters] - Optional filters (brand, category, marketRegion, sizeLabel, keyword).
 * @returns {Promise<Object>} Paginated and transformed SKU product card results:
 * {
 *   data: Array<TransformedSkuCard>,
 *   pagination: { page: number, limit: number, totalRecords: number, totalPages: number }
 * }
 */
const fetchPaginatedSkuProductCardsService = async ({
  page = 1,
  limit = 10,
  sortBy = 'name,created_at',
  sortOrder = 'DESC',
  filters = {},
}) => {
  try {
    // Fetch the active status ID
    const productStatusId = getStatusId('product_active');
    const sanitizedSortBy = sanitizeSortBy(sortBy, 'skuProductCards');

    logSystemInfo('Fetching paginated SKU product cards from DB', {
      context: 'sku-service/fetchPaginatedSkuProductCardsService',
      page,
      limit,
      sortBy: sanitizedSortBy,
      sortOrder,
      filters,
      productStatusId,
    });

    const paginatedActiveSkusWithProductRawData =
      await fetchPaginatedActiveSkusWithProductCards({
        page,
        limit,
        sortBy: sanitizedSortBy,
        sortOrder,
        productStatusId,
        filters,
      });

    return transformPaginatedSkuProductCardResult(
      paginatedActiveSkusWithProductRawData
    );
  } catch (error) {
    logSystemException('Failed to fetch SKU product cards', null, {
      context: 'sku-service/fetchPaginatedSkuProductCardsService',
      errorMessage: error.message,
    });
    throw AppError.serviceError('Failed to fetch active SKU product cards');
  }
};

/**
 * Service: Fetch Paginated SKU List
 *
 * Orchestrates SKU pagination flow using validated filters, mapped sort fields,
 * repository allowlist enforcement, and transformer normalization.
 *
 * ### Flow
 * 1. Receive sanitized query params from controller (filters, page, limit,
 *    sortBy mapped to SQL-safe column via sortMap).
 * 2. Call repository → getPaginatedSkus()
 * 3. If no rows: return empty paginated result
 * 4. Transform repository output using transformPaginatedSkuListResults()
 * 5. Log success and return structured data to controller/UI
 *
 * ### Sorting
 * `sortBy` must be an SQL-safe column name (pre-mapped in controller using
 * skuSortMap). Repository performs a final SQL allowlist check.
 *
 * @param {Object} options
 * @param {Object} [options.filters] - Validated and standardized filter object
 * @param {number} [options.page=1]  - Page number (1-based)
 * @param {number} [options.limit=10] - Items per page
 * @param {string} [options.sortBy='s.created_at']
 *        SQL-safe column name (already mapped in controller)
 * @param {string} [options.sortOrder='DESC'] - "ASC" or "DESC"
 *
 * @returns {Promise<{
 *    data: Array<Object>,
 *    pagination: { page, limit, totalRecords, totalPages }
 * }>}
 *
 * @throws {AppError} On repository or transformation failure.
 */
const fetchPaginatedSkusService = async ({
                                           filters = {},
                                           page = 1,
                                           limit = 10,
                                           sortBy = 's.created_at', // MUST be SQL-safe column
                                           sortOrder = 'DESC',
                                         }) => {
  const context = 'sku-service/fetchPaginatedSkusService';
  
  try {
    // ---------------------------------------------------------
    // Step 1 — Query raw data from repository
    // ---------------------------------------------------------
    const rawResult = await getPaginatedSkus({
      filters,
      page,
      limit,
      sortBy,      // SQL-safe column
      sortOrder,
    });
    
    // ---------------------------------------------------------
    // Step 2 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No SKU records found', {
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
    const result = transformPaginatedSkuListResults(rawResult);
    
    // ---------------------------------------------------------
    // Step 4 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Fetched paginated SKU records successfully', {
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
    logSystemException(error, 'Failed to fetch paginated SKU records', {
      context,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });
    
    throw AppError.serviceError(
      'Could not fetch SKU records. Please try again later.',
      { context }
    );
  }
};

/**
 * Service: Fetch complete SKU details with permission filtering.
 *
 * This service orchestrates:
 *   1. Fetching the base SKU record
 *   2. Applying SKU-level visibility rules
 *   3. Fetching and slicing associated SKU images
 *   4. Fetching and slicing pricing records (conditional)
 *   5. Fetching and slicing compliance records (conditional)
 *   6. Transforming the combined results into a uniform API DTO
 *
 * This is the *root entry point* for the SKU Detail page.
 * It returns only the fields the user is permitted to view.
 *
 * @param {string} skuId - SKU UUID
 * @param {Object} user - Authenticated user context
 * @returns {Promise<Object>} Fully transformed and permission-filtered SKU detail object
 *
 * @throws {AppError.NotFoundError} If SKU does not exist
 * @throws {AppError.AuthorizationError} If SKU is hidden by permission rules
 * @throws {AppError.ServiceError} For unexpected failures
 */
const fetchSkuDetailsService = async (skuId, user) => {
  const context = 'sku-service/fetchSkuDetailsService';
  const traceId = `sku-detail-${Date.now().toString(36)}`;
  
  try {
    // --------------------------------------------------------
    // 1. Fetch base SKU record
    //    (Minimal joins: product info, status info, audit info)
    // --------------------------------------------------------
    const skuRow = await getSkuDetailsById(skuId);
    if (!skuRow) {
      throw AppError.notFoundError(`SKU not found: ${skuId}`, { context });
    }
    
    // --------------------------------------------------------
    // 2. Evaluate SKU-level access rules
    // --------------------------------------------------------
    const skuAccess = await evaluateSkuStatusAccessControl(user);
    const safeSku = sliceSkuForUser(skuRow, skuAccess);
    
    // If SKU does not pass visibility rules → hide entire page
    if (!safeSku) {
      throw AppError.authorizationError(
        'You do not have permission to view this SKU.',
        { context, skuId }
      );
    }
    
    // --------------------------------------------------------
    // 3. Image visibility rules
    // --------------------------------------------------------
    const imageAccess = await evaluateSkuImageViewAccessControl(user);
    const imagesRaw = await getSkuImagesBySkuId(skuId);
    const safeImages = sliceSkuImagesForUser(imagesRaw, imageAccess);
    
    // --------------------------------------------------------
    // 4. Pricing records (optional)
    // --------------------------------------------------------
    const pricingAccess = await evaluatePricingViewAccessControl(user);
    let safePricing = [];
    
    if (pricingAccess.canViewPricing) {
      const pricingRows = await getPricingBySkuId(skuId);
      safePricing = slicePricingForUser(pricingRows, pricingAccess);
    }
    
    // --------------------------------------------------------
    // 5. Compliance records (optional)
    // --------------------------------------------------------
    const complianceAccess = await evaluateComplianceViewAccessControl(user);
    let safeComplianceRecords = [];
    
    if (complianceAccess.canViewCompliance) {
      const complianceRows = await getComplianceBySkuId(skuId);
      safeComplianceRecords = sliceComplianceRecordsForUser(
        complianceRows,
        complianceAccess
      );
    }
    
    // --------------------------------------------------------
    // 6. Build final response DTO
    //    (Transformer combines SKU + images + pricing + compliance)
    // --------------------------------------------------------
    const response = transformSkuDetail({
      sku: safeSku,
      images: safeImages,
      pricing: safePricing,
      complianceRecords: safeComplianceRecords,
    });
    
    // --------------------------------------------------------
    // 7. Structured logging
    // --------------------------------------------------------
    logSystemInfo('Fetched SKU detail', {
      context,
      traceId,
      skuId,
      userId: user?.id,
      pricingCount: safePricing.length,
      imageCount: safeImages.length,
      complianceCount: safeComplianceRecords.length,
    });
    
    return response;
  } catch (error) {
    // All errors captured and re-wrapped into service layer format
    logSystemException(error, 'Failed to fetch SKU detail', {
      context,
      traceId,
      skuId,
      userId: user?.id,
    });
    
    throw AppError.serviceError('Failed to fetch SKU detail', {
      details: error.message,
      context,
    });
  }
};

/**
 * @async
 * @function
 * @description
 * Transactionally creates one or more SKUs with full validation, locking, and base code generation.
 *
 * ### Features
 * - **Bulk Insert:** Handles any number of SKUs atomically within a single transaction.
 * - **Product Locking:** Prevents concurrent modifications by locking all related product rows.
 * - **Base Code Bootstrap:** Lazily creates any missing `(brand_code, category_code)` base code pairs in bulk.
 * - **SKU Code Generation:** Generates standardized SKU codes (e.g. `CH-HN101-R-CN`) per product variant/region.
 * - **Conflict Detection:** Checks for duplicate SKUs before insertion.
 * - **Deferred Image Handling:** Product images are processed by a separate upload API.
 *
 * @param {Array<Object>} skuList - List of SKU input objects to create.
 * @param {Object} user - Authenticated user performing the operation.
 * @returns {Promise<Array<Object>>} Newly created SKU records with generated codes.
 *
 * @throws {AppError} Validation, conflict, or database errors.
 *
 * @example
 * await createSkusService([
 *   { product_id: 'p1', brand_code: 'CH', category_code: 'HN', variant_code: '101', region_code: 'CA' },
 *   { product_id: 'p2', brand_code: 'PG', category_code: 'NM', variant_code: '204', region_code: 'CN' }
 * ], currentUser);
 */
const createSkusService = async (skuList, user) => {
  return withTransaction(async (client) => {
    const context = 'sku-service/createSkusService';
    const userId = user.id;
    const lastUsedCodeMap = new Map(); // Keeps last used base code per (brand+category)
    
    try {
      // ------------------------------------------------------------
      // 1. Validate input & business rules
      // ------------------------------------------------------------
      if (!Array.isArray(skuList) || skuList.length === 0) {
        throw AppError.validationError('No SKUs provided for creation.', { context });
      }
      
      validateSkuListBusiness(skuList);
      
      const activeStatusId = getStatusId('general_active');
      const inactiveStatusId = getStatusId('general_inactive');
      
      // ------------------------------------------------------------
      // 2. Lock all related products to prevent concurrent updates
      // ------------------------------------------------------------
      const uniqueProductIds = [...new Set(skuList.map((s) => s.product_id))];
      const lockedProducts = await lockRows(
        client,
        'products',
        uniqueProductIds,
        'FOR UPDATE',
        { context }
      );
      
      if (!lockedProducts?.length) {
        throw AppError.notFoundError('No matching products found to lock.', { context });
      }
      
      // ------------------------------------------------------------
      // 3. Ensure (brand_code, category_code) base codes exist
      // ------------------------------------------------------------
      const basePairs = skuList.map((s) => ({
        brandCode: s.brand_code,
        categoryCode: s.category_code,
        statusId: activeStatusId,
        userId,
      }));
      
      await getOrCreateBaseCodesBulk(basePairs, client);
      
      // ------------------------------------------------------------
      // 4. Generate SKU codes (e.g., CH-HN101-R-CN)
      //     Uses lastUsedCodeMap to minimize redundant DB lookups.
      // ------------------------------------------------------------
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
      
      // ------------------------------------------------------------
      // 5. Pre-check for duplicates before insertion
      //     (Avoids partial inserts or rollback costs)
      // ------------------------------------------------------------
      for (let i = 0; i < skuList.length; i++) {
        const exists = await checkSkuExists(generatedSkus[i], skuList[i].product_id, client);
        if (exists) {
          throw AppError.conflictError(`SKU already exists: ${generatedSkus[i]}`, { context });
        }
      }
      
      // ------------------------------------------------------------
      // 6. Prepare bulk insert payloads
      // ------------------------------------------------------------
      const insertPayloads = prepareSkuInsertPayloads(
        skuList,
        generatedSkus,
        inactiveStatusId,
        userId
      );
      
      // ------------------------------------------------------------
      // 7. Insert SKUs in bulk (efficient single query)
      // ------------------------------------------------------------
      const insertedSkus = await insertSkusBulk(insertPayloads, client);
      
      // ------------------------------------------------------------
      // 8. Transform & enrich results before returning
      // ------------------------------------------------------------
      const transformed = transformSkuRecord(insertedSkus, generatedSkus);
      
      // ------------------------------------------------------------
      // 9. Structured system log for auditing
      // ------------------------------------------------------------
      logSystemInfo('Bulk SKU creation completed', {
        context,
        totalInput: skuList.length,
        insertedCount: insertedSkus.length,
      });
      
      return transformed;
    } catch (error) {
      logSystemException(error, 'Failed to create SKUs in bulk', { context });
      throw AppError.databaseError('Failed to create SKUs.', { cause: error, context });
    }
  });
};

/**
 * Service: Update SKU Status
 *
 * Performs a transactional SKU status update with full concurrency protection,
 * business-rule validation, and structured system logging.
 *
 * Designed for ERP workflows where SKU lifecycle changes (e.g., DRAFT → ACTIVE,
 * ACTIVE → INACTIVE, DISCONTINUED → ARCHIVED) require strict validation.
 *
 * ### Flow
 * 1. Begin transaction and lock the SKU row (`FOR UPDATE`) to avoid race conditions.
 * 2. Verify the target status exists in the status table.
 * 3. Validate current → next transition rules (via business validator).
 * 4. Update SKU status + audit fields.
 * 5. Commit transaction and return the updated SKU ID.
 *
 * @param {Object} options
 * @param {string} options.skuId - SKU UUID
 * @param {string} options.statusId - Target status UUID
 * @param {{ id: string }} options.user - Authenticated user performing the update
 *
 * @returns {Promise<{ id: string }>} Updated SKU record ID
 *
 * @throws {AppError}
 *   - If the SKU does not exist
 *   - If the target status is invalid
 *   - If the transition violates lifecycle rules
 *   - If a concurrent update prevents the update
 */
const updateSkuStatusService = async ({ skuId, statusId, user }) => {
  return withTransaction(async (client) => {
    const context = 'sku-service/updateSkuStatusService';
    const userId = user.id;
    
    // ----------------------------------------
    // 1. Lock SKU row for concurrency safety
    // ----------------------------------------
    const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context });
    if (!sku) {
      throw AppError.notFoundError('SKU not found.', { context, skuId });
    }
    
    // ----------------------------------------
    // 2. Validate that the target status exists
    // ----------------------------------------
    const statusExists = await checkStatusExists(statusId, client);
    if (!statusExists) {
      throw AppError.validationError('Invalid or inactive status ID.', {
        context,
        statusId,
      });
    }
    
    // ----------------------------------------
    // 3. Basic validation (prevent no-op)
    // ----------------------------------------
    if (sku.status_id === statusId) {
      throw AppError.validationError('SKU is already in this status.', {
        context,
        skuId,
        statusId,
      });
    }
    
    // ----------------------------------------
    // 4. Apply SKU-specific business rules
    // ----------------------------------------
    assertValidSkuStatusTransition(sku.status_id, statusId);
    
    // ----------------------------------------
    // 5. Update SKU status inside the transaction
    // ----------------------------------------
    const updated = await updateSkuStatus(skuId, statusId, userId, client);
    
    if (!updated) {
      throw AppError.conflictError(
        'Concurrent update detected — SKU status not updated.',
        { context, skuId }
      );
    }
    
    // ----------------------------------------
    // 6. Log success
    // ----------------------------------------
    logSystemInfo('Updated SKU status successfully', {
      context,
      skuId,
      fromStatusId: sku.status_id,
      toStatusId: statusId,
      userId,
    });
    
    return updated;
  });
};

module.exports = {
  fetchPaginatedSkuProductCardsService,
  fetchPaginatedSkusService,
  fetchSkuDetailsService,
  createSkusService,
  updateSkuStatusService,
};
