const {
  transformPaginatedResult,
  deriveInventoryStatusFlags,
} = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const { differenceInDays } = require('date-fns');
const {
  transformInventoryRecordBase, transformInventoryRecordSummaryBase,
} = require('./transform-inventory-record-base');

/**
 * Transforms raw KPI summary query result rows into structured output.
 *
 * @param {Array} rows - Raw rows returned from the KPI summary SQL query.
 * @returns {Array} An array of transformed KPI summary objects.
 */
const transformLocationInventoryKpiSummary = (rows = []) => {
  return rows.map((row) => ({
    batchType: row.batch_type, // 'product' | 'packaging_material' | 'total'

    totalProducts: Number(row.total_products ?? 0),
    totalMaterials: Number(row.total_materials ?? 0),

    locationsCount: Number(row.locations_count ?? 0),
    totalQuantity: Number(row.total_quantity ?? 0),
    totalReserved: Number(row.total_reserved ?? 0),
    totalAvailable: Number(row.total_available ?? 0),

    nearExpiryInventoryRecords: Number(row.near_expiry_inventory_records ?? 0),
    expiredInventoryRecords: Number(row.expired_inventory_records ?? 0),

    expiredProductBatches: Number(row.expired_product_batches ?? 0),
    expiredMaterialBatches: Number(row.expired_material_batches ?? 0),

    lowStockCount: Number(row.low_stock_count ?? 0),
  }));
};

/**
 * Transforms a raw SQL row from the location inventory summary query
 * into a normalized inventory record with derived stock/expiry info.
 *
 * Supports both product and packaging material inventory types.
 * Removes irrelevant null values and separates product vs. material details.
 *
 * @param {Object} row - Raw SQL result row
 * @returns {Object} Transformed inventory record for frontend consumption
 */
const transformLocationInventorySummaryRow = (row) => {
  const isProduct = row.item_type === 'product';
  const productName = getProductDisplayName(row);
  const statusInfo = deriveInventoryStatusFlags(row);

  return cleanObject({
    itemId: row.item_id,
    typeLabel: isProduct ? 'product' : 'packaging_material',
    displayName: isProduct
      ? productName || row.sku || '[Unnamed Product]'
      : row.material_name || row.material_code || '[Unnamed Material]',

    totalLots: Number(row.total_lots) || 0,
    earliestManufactureDate: row.earliest_manufacture_date || null,
    createdAt: row.created_at || null,

    ...statusInfo,
  });
};

/**
 * Transforms a paginated SQL result of raw location inventory summary rows
 * into a fully structured, frontend-ready result using `transformLocationInventorySummaryRow`.
 *
 * This includes:
 * - Row-level normalization (product/material shape)
 * - Derived stock, expiry, and quantity flags
 * - Preserves pagination metadata
 *
 * @param {Object} paginatedResult - The raw result from `paginateQuery`
 * @param {Array<Object>} paginatedResult.data - Raw SQL rows
 * @param {Object} paginatedResult.pagination - Pagination metadata (page, limit, totalRecords, totalPages)
 * @returns {{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }} Transformed result for frontend consumption
 */
const transformPaginatedLocationInventorySummaryResult = (paginatedResult) =>
  transformPaginatedResult(
    paginatedResult,
    transformLocationInventorySummaryRow
  );

/**
 * Transform a single raw location inventory summary record.
 *
 * @param {Object} row - Raw DB record.
 * @returns {Object} Transformed and cleaned object.
 */
const transformLocationInventorySummaryDetailsItem = (row) =>
  cleanObject({
    locationInventoryId: row.location_inventory_id,
    batchType: row.batch_type,

    item:
      row.batch_type === 'product'
        ? cleanObject({
            type: 'sku',
            id: row.sku_id,
            code: row.sku,
          })
        : cleanObject({
            type: 'material',
            id: row.material_id,
            code: row.material_code,
          }),

    lotNumber: row.lot_number,
    manufactureDate:
      row.product_manufacture_date || row.material_manufacture_date,
    expiryDate: row.product_expiry_date || row.material_expiry_date,

    quantity: cleanObject({
      locationQuantity: row.location_quantity,
      reserved: row.reserved_quantity,
      available: Math.max(
        (row.location_quantity || 0) - (row.reserved_quantity || 0),
        0
      ),
    }),

    status: cleanObject({
      id: row.status_id,
      name: row.status_name,
      date: row.status_date,
    }),

    timestamps: cleanObject({
      inboundDate: row.inbound_date,
      outboundDate: row.outbound_date,
      lastUpdate: row.last_update,
    }),
    durationInStorage: row.inbound_date
      ? differenceInDays(new Date(), new Date(row.inbound_date))
      : null,

    location: cleanObject({
      id: row.location_id,
      name: row.location_name,
      type: row.location_type,
    }),
  });

/**
 * Transform a full paginated location inventory summary result.
 *
 * @param {Object} paginatedResult - The raw-paginated result.
 * @returns {Object} Paginated and transformed result.
 */
const transformPaginatedLocationInventorySummaryDetails = (paginatedResult) =>
  transformPaginatedResult(
    paginatedResult,
    transformLocationInventorySummaryDetailsItem
  );

/**
 * Transforms a single raw location inventory row into structured, display-ready data.
 * Dynamically handles both product and material item types.
 *
 * @param {Object} row - A raw DB row from the location inventory query
 * @returns {Object} Transformed and cleaned location inventory object
 */
const transformLocationInventoryRecord = (row) =>
  transformInventoryRecordBase(row, {
    idField: 'location_inventory_id',
    scopeKey: 'location',
    scopeIdField: 'location_id',
    scopeNameField: 'location_name',
    scopeTypeField: 'location_type_name',
    quantityField: 'location_quantity',
  });

/**
 * Transforms a paginated result set of raw location inventory rows into enriched, display-ready objects.
 *
 * This function applies `transformLocationInventoryRecord` to each record in the paginated result,
 * converting database field names into structured objects, deriving display names, and attaching status flags.
 *
 * @param {Object} paginatedResult - The raw paginated database result
 * @returns {Object} Transformed a paginated result with structured inventory data
 */
const transformPaginatedLocationInventoryRecordResults = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformLocationInventoryRecord);

/**
 * Transforms lightweight enriched location inventory records
 * (typically after insert or quantity adjustment) into a normalized response format.
 *
 * - Dynamically merges product or material info into a single `itemInfo` section.
 * - Normalizes for summary/confirmation UI.
 * - Strips null/undefined fields using `cleanObject`.
 *
 * @param {Array<Object>} rows - Raw DB rows from the location inventory join query.
 * @returns {Array<InventoryRecordOutput>} - Transformed summary records.
 */
const transformLocationInventoryResponseRecords = (rows) => {
  return transformInventoryRecordSummaryBase(rows, {
    quantityField: 'location_quantity',
    getProductDisplayName,
    cleanObject,
  });
};

module.exports = {
  transformLocationInventoryKpiSummary,
  transformPaginatedLocationInventorySummaryResult,
  transformPaginatedLocationInventorySummaryDetails,
  transformPaginatedLocationInventoryRecordResults,
  transformLocationInventoryResponseRecords,
};
