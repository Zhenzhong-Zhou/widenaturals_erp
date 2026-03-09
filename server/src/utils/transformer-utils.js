const { cleanObject } = require('./object-utils');

/**
 * Applies a transformer function to an array of rows safely.
 *
 * @param {Array} rows - The raw rows to transform.
 * @param {Function} transformer - The function to apply to each row.
 * @returns {Array} The transformed rows.
 */
const transformRows = (rows, transformer) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(transformer);
};

/**
 * Applies an asynchronous transformation function to each item in an array.
 *
 * Designed for use in repository/service transformation pipelines where
 * each row may require async enrichment (e.g., permission checks,
 * derived calculations, secondary lookups).
 *
 * Uses `Promise.all` to run transformations concurrently for better
 * performance when handling paginated datasets.
 *
 * If the input is not a valid array, an empty array is returned.
 *
 * @template T,U
 *
 * @param {T[]} rows
 * Array of raw rows to transform.
 *
 * @param {(row: T, index: number) => Promise<U> | U} transformer
 * Async or sync function that converts a raw row into a new shape.
 *
 * @returns {Promise<U[]>}
 * Array of transformed rows in the same order as the input.
 *
 * @example
 * const transformed = await transformRowsAsync(rows, transformUserLookup);
 */
const transformRowsAsync = async (rows, transformer) => {
  if (!Array.isArray(rows)) return [];
  return Promise.all(rows.map(transformer));
};

/**
 * Generic paginated transformation result.
 *
 * @template T
 * @typedef {Object} PaginatedResult
 * @property {T[]} data
 * @property {{
 *   page: number,
 *   limit: number,
 *   totalRecords: number,
 *   totalPages: number
 * }} pagination
 */

/**
 * Transforms a paginated repository result by applying a row transformer
 * to each record while preserving pagination metadata.
 *
 * This helper is typically used in the service layer to convert raw
 * database rows into UI-ready structures (DTOs, lookup items, etc.).
 *
 * If the input result is malformed or contains no valid `data` array,
 * a safe empty paginated structure is returned.
 *
 * @template T,U
 *
 * @param {{
 *   data: T[],
 *   pagination?: {
 *     page?: number,
 *     limit?: number,
 *     totalRecords?: number,
 *     totalPages?: number
 *   }
 * }} paginatedResult
 * Raw paginated query result returned by a repository function.
 *
 * @param {(row: T) => Promise<U> | U} transformFn
 * Row transformer applied to each record.
 *
 * @returns {Promise<PaginatedResult<T>>}
 * Paginated result containing transformed rows.
 *
 * @example
 * const result = await transformPageResult(repoResult, transformUserLookup);
 *
 * // {
 * //   data: [...transformedUsers],
 * //   pagination: { page: 1, limit: 20, totalRecords: 145, totalPages: 8 }
 * // }
 */
const transformPageResult = async (paginatedResult, transformFn) => {
  if (!paginatedResult || !Array.isArray(paginatedResult.data)) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        totalRecords: 0,
        totalPages: 0,
      },
    };
  }

  const { data = [], pagination = {} } = paginatedResult;

  const transformedItems = (await transformRowsAsync(data, transformFn)).filter(
    Boolean
  );

  const page = Number(pagination.page ?? 1);
  const limit = Number(pagination.limit ?? 10);
  const totalRecords = Number(pagination.totalRecords ?? 0);
  const totalPages = pagination.totalPages ?? Math.ceil(totalRecords / limit);

  return {
    data: transformedItems,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
    },
  };
};

/**
 * Generic load-more pagination result.
 *
 * @template T
 * @typedef {Object} LoadMoreResult
 * @property {T[]} items - Transformed result items.
 * @property {number} offset - Current query offset.
 * @property {number} limit - Maximum number of items returned.
 * @property {boolean} hasMore - Indicates whether more records exist.
 */

/**
 * Generic lookup item used by dropdowns and autocomplete components.
 *
 * @typedef {Object} LookupItem
 * @property {string} id
 * @property {string} label
 * @property {boolean} [isActive]
 */

/**
 * Generic paginated query result returned from repository functions.
 *
 * @template T
 * @typedef {Object} PaginatedQueryResult
 * @property {T[]} data - Array of raw rows returned by the query.
 * @property {{
 *   page?: number,
 *   limit?: number,
 *   totalRecords?: number,
 *   offset?: number
 * }} [pagination] - Optional pagination metadata.
 */

/**
 * Transforms a paginated query result into a load-more compatible response.
 *
 * Applies the provided transformer function to each row in `paginatedResult.data`,
 * allowing callers to reshape raw database rows into API response objects.
 *
 * The transformer may be synchronous or asynchronous.
 *
 * If the input result is invalid or missing data, a safe default empty response
 * will be returned.
 *
 * @template TInput
 * @template TOutput
 *
 * @param {PaginatedQueryResult<TInput>} paginatedResult
 * Raw paginated result returned from a repository query.
 *
 * @param {(row: TInput) => TOutput | Promise<TOutput>} transformFn
 * Row-level transformer used to convert raw rows into API response objects.
 *
 * @returns {Promise<LoadMoreResult<TOutput>>}
 * A load-more compatible response containing transformed items and pagination metadata.
 */
const transformLoadMoreResult = async (paginatedResult, transformFn) => {
  if (!paginatedResult || !Array.isArray(paginatedResult.data)) {
    return {
      items: [],
      offset: 0,
      limit: 10,
      hasMore: false,
    };
  }

  const { data = [], pagination = {} } = paginatedResult;

  const transformedItems = (await transformRowsAsync(data, transformFn)).filter(
    Boolean
  );

  const page = Number(pagination.page ?? 1);
  const limit = Number(pagination.limit ?? 10);
  const totalRecords = Number(pagination.totalRecords ?? 0);
  const offset = pagination.offset ?? (page - 1) * limit;

  return {
    items: transformedItems,
    offset,
    limit,
    hasMore: offset + transformedItems.length < totalRecords,
  };
};

/**
 * Derives high-level inventory status flags and severity from raw inventory data.
 *
 * @param {Object} row - Raw inventory row from SQL query
 * @param {Date | string} [row.nearest_expiry_date] - Earliest upcoming expiry date
 * @param {number | string} [row.available_quantity] - Available inventory amount
 * @param {number | string} [row.reserved_quantity] - Reserved inventory amount
 * @param {number | string} [row.total_lot_quantity] - Total quantity across lots
 * @param {Date | string} [row.earliest_manufacture_date] - First manufacture date
 * @param {string} [row.display_status] - High-level inventory status (optional)
 * @param {number} [lowStockThreshold=30] - Configurable threshold for low stock
 * @param {number} [nearExpiryDays=90] - Configurable expiry warning window
 *
 * @returns {{
 *   reservedQuantity: number,
 *   availableQuantity: number,
 *   totalLotQuantity: number,
 *   earliestManufactureDate: Date | null,
 *   nearestExpiryDate: Date | null,
 *   displayStatus: string | null,
 *   stockLevel: 'expired' | 'low_stock' | 'in_stock',
 *   expirySeverity: 'critical' | 'warning' | 'normal'
 * }}
 */
const deriveInventoryStatusFlags = (
  row,
  lowStockThreshold = 30,
  nearExpiryDays = 90
) => {
  const now = new Date();

  const nearestExpiryDate = row.nearest_expiry_date
    ? new Date(row.nearest_expiry_date)
    : null;

  const manufactureDate = row.earliest_manufacture_date
    ? new Date(row.earliest_manufacture_date)
    : null;

  const availableQty = Number(row.available_quantity) || 0;
  const reservedQty = Number(row.reserved_quantity) || 0;
  const totalQty = Number(row.total_lot_quantity) || 0;

  const stockLevel =
    nearestExpiryDate && nearestExpiryDate < now
      ? 'expired'
      : availableQty <= lowStockThreshold
        ? 'low_stock'
        : 'in_stock';

  const expirySeverity =
    nearestExpiryDate && nearestExpiryDate < now
      ? 'critical'
      : nearestExpiryDate &&
          nearestExpiryDate <=
            new Date(now.getTime() + nearExpiryDays * 86400000)
        ? 'warning'
        : 'normal';

  return {
    reservedQuantity: reservedQty,
    availableQuantity: availableQty,
    totalLotQuantity: totalQty,
    earliestManufactureDate: manufactureDate,
    nearestExpiryDate,
    displayStatus: row.display_status || null,
    stockLevel,
    expirySeverity,
  };
};

/**
 * Generic transformer for lookup records with `{ id, name }` shape.
 * Converts to `{ id, label }` for dropdowns and cleans null/undefined values.
 *
 * @param {{ id: string, name: string }} row - The database row
 * @returns {{ id: string, label: string }}
 */
const transformIdNameToIdLabel = (row) => {
  return cleanObject({
    id: row?.id,
    label: row?.name,
  });
};

/**
 * Selectively includes diagnostic flags from an enriched lookup row
 * based on the user's access control permissions.
 *
 * This function is typically used to expose additional metadata in
 * lookup dropdown results, such as status flags and abnormal indicators,
 * only when the user is authorized to view them.
 *
 * Flags may include:
 * - `isActive`: Whether the record is currently active.
 * - `isValidToday`: Whether the record is valid as of the current date.
 * - `isNormal`: Whether the SKU passed all required status checks.
 * - `issueReasons`: Human-readable reasons explaining abnormal state (if `isNormal` is false).
 *
 * @param {Object} row - An enriched row that may contain flags like `isActive`, `isValidToday`, `isNormal`, etc.
 * @param {Object} userAccess - User access context determining which flags should be included.
 * @param {boolean} [userAccess.canViewAllStatuses=false] - Whether to expose `isActive`.
 * @param {boolean} [userAccess.canViewAllValidLookups=false] - Whether to expose `isValidToday`.
 * @param {boolean} [userAccess.allowAllSkus=false] - Whether to expose `isNormal` and `issueReasons`.
 * @returns {Object} A subset of diagnostic flags from the row, filtered by access permissions.
 */
const includeFlagsBasedOnAccess = (row, userAccess = {}) => {
  const {
    canViewAllStatuses = false,
    canViewAllValidLookups = false,
    allowAllSkus = false,
  } = userAccess;

  if (!row) return {};

  const result = {};

  if (canViewAllStatuses) {
    result.isActive = row.isActive ?? false;
  }

  if (canViewAllValidLookups) {
    result.isValidToday = row.isValidToday ?? false;
  }

  if (allowAllSkus && 'isNormal' in row) {
    result.isNormal = row.isNormal;

    if (!row.isNormal && Array.isArray(row.issueReasons)) {
      result.issueReasons = row.issueReasons;
    }
  }

  return cleanObject(result);
};

module.exports = {
  transformRows,
  transformPageResult,
  transformLoadMoreResult,
  deriveInventoryStatusFlags,
  transformIdNameToIdLabel,
  includeFlagsBasedOnAccess,
};
