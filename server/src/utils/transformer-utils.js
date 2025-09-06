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
 * Transforms a generic paginated result using a row-level transformer.
 *
 * Supports both:
 * - traditional `pagination` format: `{ data, pagination: { page, limit, totalRecords, totalPages } }`
 * - infinite scroll `loadMore` format: `{ items, offset, limit, hasMore }`
 *
 * The transformer function can be either synchronous or asynchronous (i.e., return a Promise).
 *
 * If the input result is malformed or has no data, a default empty pagination structure is returned.
 *
 * @template TInput
 * @template TOutput
 *
 * @param {{ data: TInput[], pagination?: { page?: number, limit?: number, totalRecords?: number, totalPages?: number, offset?: number } }} paginatedResult
 *   The original paginated query result.
 *
 * @param {(row: TInput) => TOutput | Promise<TOutput>} transformFn
 *   A row-level transformer function that maps each item in `data` to a new shape.
 *
 * @param {Object} [options] - Optional behavior flags.
 * @param {boolean} [options.includeLoadMore=false] - Whether to return `items`, `offset`, `hasMore` instead of `data`, `pagination`.
 *
 * @returns {Promise<
 *   | { data: TOutput[], pagination: { page: number, limit: number, totalRecords: number, totalPages: number } }
 *   | { items: TOutput[], offset: number, limit: number, hasMore: boolean }
 * >}
 *   Transformed paginated or load-more-compatible result.
 */
const transformPaginatedResult = async (
  paginatedResult,
  transformFn,
  options = {}
) => {
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

  const transformedItems = await Promise.all(data.map(transformFn));

  // Support both page and offset style
  const page = Number(pagination.page ?? 1);
  const limit = Number(pagination.limit ?? 10);
  const totalRecords = Number(pagination.totalRecords ?? 0);
  const offset = pagination.offset ?? (page - 1) * limit;
  const totalPages = pagination.totalPages ?? Math.ceil(totalRecords / limit);

  if (options.includeLoadMore) {
    return {
      items: transformedItems,
      offset,
      limit,
      hasMore: offset + transformedItems.length < totalRecords,
    };
  }

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
  transformPaginatedResult,
  deriveInventoryStatusFlags,
  transformIdNameToIdLabel,
  includeFlagsBasedOnAccess,
};
