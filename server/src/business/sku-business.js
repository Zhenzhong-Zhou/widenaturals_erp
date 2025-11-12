const { getSkuAndProductStatus } = require('../repositories/sku-repository');
const AppError = require('../utils/AppError');
const {
  checkPermissions,
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const { PERMISSIONS } = require('../utils/constants/domain/sku-constants');
const { getGenericIssueReason } = require('../utils/enrich-utils');

/**
 * Resolves the allowed product/SKU status IDs for the given user.
 * Returns `null` to indicate no restriction (full visibility).
 *
 * @param {object} user - Authenticated user
 * @returns {Promise<string[] | null>}
 */
const getAllowedStatusIdsForUser = async (user) => {
  const canViewAll = await checkPermissions(
    user,
    ['view_all_product_statuses'],
    {
      allowRootAccess: true,
    }
  );

  return canViewAll ? null : [getStatusId('product_active')];
};

/**
 * Resolves the allowed pricing type codes a user is allowed to see.
 * Returns `null` to indicate all types are allowed.
 *
 * @param {object} user - Authenticated user
 * @returns {Promise<string[] | null>} - Pricing type codes (e.g., ['PRC-M001', 'PRC-R003'])
 */
const getAllowedPricingTypesForUser = async (user) => {
  const canViewAll = await checkPermissions(user, ['view_all_pricing_types'], {
    allowRootAccess: true,
  });

  // Retail = PRC-R003, MSRP = PRC-M001
  return canViewAll ? null : ['PRC-M001', 'PRC-R003'];
};

/**
 * Determines whether the user is authorized to view the given SKU,
 * based on product/SKU status and user permissions.
 *
 * @param {object} user - Authenticated user object (must include id and role_id)
 * @param {string} skuId - The ID of the SKU to evaluate
 * @returns {Promise<boolean>}
 * @throws {AppError} If the user is not allowed to access the SKU
 */
const canAccessSku = async (user, skuId) => {
  try {
    const allowedStatusIds = await getAllowedStatusIdsForUser(user);
    if (!allowedStatusIds) return true; // root or elevated roles bypass restrictions

    const { skuStatusId, productStatusId } =
      await getSkuAndProductStatus(skuId);

    if (
      !allowedStatusIds.includes(skuStatusId) ||
      !allowedStatusIds.includes(productStatusId)
    ) {
      throw AppError.authorizationError(
        'You do not have permission to access this SKU'
      );
    }

    return true;
  } catch (err) {
    logSystemException('Access check failed in canAccessSku()', {
      context: 'canAccessSku',
      skuId,
      userId: user?.id,
      error: err,
    });
    throw err;
  }
};

/**
 * Evaluates whether the user is allowed to bypass SKU stock and status filters
 * in SKU lookup queries (e.g., for sales, internal orders, or admin overrides).
 *
 * Resolves to a flag `allowAllSkus` that enables visibility of inactive or out-of-stock SKUs.
 * Common use cases include:
 * - Admin overrides
 * - Internal sample or R&D orders
 * - Backorders / preorders
 *
 * @param {Object} user - Authenticated user object (must include ID or context).
 * @returns {Promise<{ allowAllSkus: boolean }>} Access control decision for SKU visibility.
 */
const evaluateSkuFilterAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const allowAllSkus =
      isRoot ||
      permissions.includes(PERMISSIONS.ADMIN_OVERRIDE_SKU_FILTERS) ||
      permissions.includes(PERMISSIONS.ALLOW_INTERNAL_ORDER_SKUS) ||
      permissions.includes(PERMISSIONS.ALLOW_BACKORDER_SKUS);

    return { allowAllSkus };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate SKU filter access control', {
      context: 'sku-business/evaluateSkuFilterAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate SKU filter access control',
      {
        details: err.message,
        stage: 'evaluate-sku-access',
      }
    );
  }
};

/**
 * Enforces visibility restrictions on SKU filtering
 * based on the user's access control flags.
 *
 * - If the user lacks permission to view all SKUs, `allowAllSkus` is false
 *   and filtering for available stock is automatically enabled.
 * - The `requireAvailableStockFrom` option is defaulted to `'warehouse'`
 *   if not explicitly set, ensuring controlled source visibility.
 *
 * This function is useful for SKU lookup queries where inactive or out-of-stock
 * products should be hidden unless elevated access is granted (e.g., internal orders).
 *
 * @param {Object} options - Original options object used in SKU queries.
 * @param {Object} userAccess - User access flags, e.g., `{ allowAllSkus: boolean }`.
 * @returns {Object} Adjusted options with enforced SKU visibility rules.
 */
const enforceSkuLookupVisibilityRules = (options = {}, userAccess = {}) => {
  const adjusted = {
    ...options,
    allowAllSkus: !!userAccess.allowAllSkus,
  };

  // Force stock check if not allowed to see inactive or out-of-stock SKUs
  if (!userAccess.allowAllSkus) {
    adjusted.requireAvailableStock = true;

    // Default to warehouse if not specified
    adjusted.requireAvailableStockFrom =
      adjusted.requireAvailableStockFrom || 'warehouse';
  }

  return adjusted;
};

/**
 * Applies access control filters to a SKU lookup query based on user permissions.
 *
 * - If the user lacks permission to view inactive SKUs, `status_id` is forced to active.
 * - If the user lacks permission to view out-of-stock SKUs, a virtual flag
 *   `requireAvailableStock = true` is added (to enforce EXISTS stock check in builder).
 *
 * @param {object} filters - Base query filters (brand, category, keyword, etc.).
 * @param {object} userAccess - Access flags (e.g., `{ allowAllSkus: boolean }`).
 * @param {string} activeStatusId - UUID for the 'active' SKU/product status.
 * @returns {object} Modified query object with enforced filters.
 */
const filterSkuLookupQuery = (
  filters = {},
  userAccess = {},
  activeStatusId
) => {
  try {
    if (typeof activeStatusId !== 'string' || activeStatusId.length === 0) {
      throw AppError.validationError(
        '[filterSkuLookupQuery] Missing or invalid `activeStatusId`'
      );
    }

    if (!userAccess || typeof userAccess !== 'object') {
      throw AppError.validationError(
        '[filterSkuLookupQuery] Invalid `userAccess` object'
      );
    }

    const modified = { ...filters };

    if (!userAccess.allowAllSkus) {
      // Enforce active status on both SKU and Product level
      modified.sku_status_id = activeStatusId;
      modified.product_status_id = activeStatusId;

      // Require stock availability checks
      modified.requireAvailableStock = true;

      // Only set default if not already provided
      if (!modified.requireAvailableStockFrom) {
        modified.requireAvailableStockFrom = 'warehouse';
      }
    }

    return modified;
  } catch (err) {
    logSystemException(
      err,
      'Failed to apply access filters in filterSkuLookupQuery',
      {
        context: 'sku-business/filterSkuLookupQuery',
        originalFilters: filters,
        userAccess,
        activeStatusId,
      }
    );

    throw AppError.businessError('Unable to apply SKU lookup access filters', {
      details: err.message,
      stage: 'filter-sku-lookup',
      cause: err,
    });
  }
};

/**
 * Enriches a SKU row with derived flags about its status validity.
 *
 * - If the row has no status fields at all, it is considered `isNormal = true`.
 * - Otherwise, each status field (SKU, product, warehouse, location, batch)
 *   is compared against the expected "active/normal" status IDs.
 * - The row is considered `isNormal = true` only if all checks pass.
 * - If any check fails, `issueReasons` is added with human-readable messages
 *   describing which statuses are invalid.
 *
 * @param {object} row - Raw SKU row that may include status fields:
 *   {
 *     sku_status_id?: string,
 *     product_status_id?: string,
 *     warehouse_status_id?: string,
 *     location_status_id?: string,
 *     batch_status_id?: string,
 *     ...
 *   }
 * @param {object} expectedStatusIds - Map of expected status IDs:
 *   {
 *     sku: string,
 *     product: string,
 *     warehouse: string,
 *     location: string,
 *     batch: string
 *   }
 *
 * @returns {object} The enriched row, extended with:
 *   - `isNormal: boolean` — true if all checks pass or no status fields exist.
 *   - `issueReasons?: string[]` — array of human-readable reasons when `isNormal` is false.
 *
 * @example
 * const row = { sku_status_id: 'abc', product_status_id: 'xyz' };
 * const expected = { sku: 'abc', product: 'xyz', warehouse: 'w1', location: 'l1', batch: 'b1' };
 * const result = enrichSkuRow(row, expected);
 *
 * // result = {
 * //   sku_status_id: 'abc',
 * //   product_status_id: 'xyz',
 * //   isNormal: true
 * // }
 */
const enrichSkuRow = (row, expectedStatusIds) => {
  const {
    sku_status_id,
    product_status_id,
    warehouse_status_id,
    location_status_id,
    batch_status_id,
  } = row;

  // If no status fields at all → default to normal
  const noStatusFields =
    sku_status_id == null &&
    product_status_id == null &&
    warehouse_status_id == null &&
    location_status_id == null &&
    batch_status_id == null;

  if (noStatusFields) {
    return {
      ...row,
      isNormal: true,
    };
  }

  const statusChecks = {
    skuStatusValid: sku_status_id === expectedStatusIds.sku,
    productStatusValid: product_status_id === expectedStatusIds.product,
    warehouseInventoryValid:
      !warehouse_status_id ||
      warehouse_status_id === expectedStatusIds.warehouse,
    locationInventoryValid:
      !location_status_id || location_status_id === expectedStatusIds.location,
    batchStatusValid:
      !batch_status_id || batch_status_id === expectedStatusIds.batch,
  };

  const isNormal = Object.values(statusChecks).every(Boolean);

  return {
    ...row,
    isNormal,
    ...(isNormal
      ? {}
      : {
          issueReasons: Object.entries(statusChecks)
            .filter(([_, valid]) => !valid)
            .map(([key]) => getGenericIssueReason(key)),
        }),
  };
};

/**
 * @constant SKU_REQUIRED_FIELDS
 * Immutable list of required fields for all SKU creation payloads.
 */
const SKU_REQUIRED_FIELDS = Object.freeze([
  'product_id',
  'brand_code',
  'category_code',
  'variant_code',
  'region_code',
]);

/**
 * Validates a single SKU creation payload against required fields and business rules.
 *
 * @param {object} skuData - The SKU payload to validate.
 * @param {string} [context='sku-business/validateSkuCreationBusiness'] - Log context for tracing.
 * @throws {AppError.validationError} If a required field is missing or invalid.
 *
 * @example
 * validateSkuCreationBusiness({
 *   product_id: '123',
 *   brand_code: 'CH',
 *   category_code: 'HN',
 *   variant_code: '101',
 *   region_code: 'CA',
 * });
 */
const validateSkuCreationBusiness = (
  skuData,
  context = 'sku-business/validateSkuCreationBusiness'
) => {
  // Use centralized constant for required fields
  for (const field of SKU_REQUIRED_FIELDS) {
    if (!skuData[field]) {
      throw AppError.validationError(`Missing required field: ${field}`, { context });
    }
  }
  
  // Log only essential identifying metadata (avoid verbose logging)
  logSystemInfo('SKU creation input validated.', {
    context,
    product_id: skuData.product_id,
    brand_code: skuData.brand_code,
    category_code: skuData.category_code,
  });
};

/**
 * Validates an array of SKU creation payloads in a single batch.
 *
 * Performs structural validation (array shape, non-empty) and
 * iteratively validates each item with `validateSkuCreationBusiness`.
 *
 * @param {Array<object>} skuList - List of SKU payloads to validate.
 * @param {string} [context='sku-business/validateSkuListBusiness'] - Log context for tracing.
 * @throws {AppError.validationError} If the list is empty or contains invalid entries.
 *
 * @example
 * validateSkuListBusiness([
 *   { product_id: 'p1', brand_code: 'CH', category_code: 'HN', variant_code: '101', region_code: 'CA' },
 *   { product_id: 'p2', brand_code: 'PG', category_code: 'NM', variant_code: '204', region_code: 'CN' }
 * ]);
 */
const validateSkuListBusiness = (
  skuList,
  context = 'sku-business/validateSkuListBusiness'
) => {
  // Structural validation first
  if (!Array.isArray(skuList) || skuList.length === 0) {
    throw AppError.validationError(
      `SKU list is empty or invalid. Expected fields: ${SKU_REQUIRED_FIELDS.join(', ')}`,
      { context }
    );
  }
  
  // Validate each entry
  for (const sku of skuList) {
    validateSkuCreationBusiness(sku, context);
  }
  
  // Summary log
  logSystemInfo('Bulk SKU creation input validated successfully.', {
    context,
    count: skuList.length,
  });
};

/**
 * Normalizes a single SKU payload into a schema-compliant record for insertion.
 *
 * @param {object} skuData - Original SKU payload.
 * @param {string} generatedSku - Generated SKU code string.
 * @param {string} statusId - Default status ID.
 * @param {string} userId - ID of the creator.
 * @returns {object} Normalized payload suitable for DB insertion.
 *
 * @example
 * const record = prepareSkuInsertPayload(sku, 'CH-HN101-R-CN', activeStatusId, user.id);
 */
const prepareSkuInsertPayload = (skuData, generatedSku, statusId, userId) => ({
  product_id: skuData.product_id,
  sku: generatedSku,
  barcode: skuData.barcode ?? null,
  language: skuData.language ?? 'en-fr',
  country_code: skuData.country_code ?? null,
  market_region: skuData.market_region ?? null,
  size_label: skuData.size_label ?? null,
  description: skuData.description ?? null,
  length_cm: skuData.length_cm ?? null,
  width_cm: skuData.width_cm ?? null,
  height_cm: skuData.height_cm ?? null,
  weight_g: skuData.weight_g ?? null,
  status_id: statusId,
  created_by: userId,
});

/**
 * Prepares normalized database-ready payloads for multiple SKUs.
 *
 * Ensures that all optional fields are defaulted or sanitized.
 * Each SKU payload is processed by `prepareSkuInsertPayload`.
 *
 * @param {Array<object>} skuList - Raw SKU input payloads.
 * @param {Array<string>} generatedSkus - Generated SKU codes (must match length of skuList).
 * @param {string} statusId - Default status ID for inserted SKUs.
 * @param {string} userId - ID of the user performing the creation.
 * @returns {Array<object>} Prepared payloads ready for bulk insertion.
 *
 * @example
 * const payloads = prepareSkuInsertPayloads(skus, codes, activeStatusId, user.id);
 */
const prepareSkuInsertPayloads = (skuList, generatedSkus, statusId, userId) => {
  // Optimization: preallocate array for better V8 perf on large lists
  const result = new Array(skuList.length);
  
  for (let i = 0; i < skuList.length; i++) {
    result[i] = prepareSkuInsertPayload(skuList[i], generatedSkus[i], statusId, userId);
  }
  
  return result;
};

module.exports = {
  getAllowedStatusIdsForUser,
  getAllowedPricingTypesForUser,
  canAccessSku,
  evaluateSkuFilterAccessControl,
  enforceSkuLookupVisibilityRules,
  filterSkuLookupQuery,
  enrichSkuRow,
  validateSkuCreationBusiness,
  validateSkuListBusiness,
  prepareSkuInsertPayload,
  prepareSkuInsertPayloads,
};
