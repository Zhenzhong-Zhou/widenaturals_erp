const {
  transformPageResult,
  deriveInventoryStatusFlags,
} = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const { differenceInDays } = require('date-fns');
const {
  transformInventoryRecordBase,
  transformInventoryRecordSummaryBase,
} = require('./transform-inventory-record-base');

/**
 * Transforms raw KPI summary query result rows into structured KPI objects.
 *
 * @param {Array<{
 *   batch_type: 'product' | 'packaging_material' | 'total',
 *   total_products?: number | string | null,
 *   total_materials?: number | string | null,
 *   locations_count?: number | string | null,
 *   total_quantity?: number | string | null,
 *   total_reserved?: number | string | null,
 *   total_available?: number | string | null,
 *   near_expiry_inventory_records?: number | string | null,
 *   expired_inventory_records?: number | string | null,
 *   expired_product_batches?: number | string | null,
 *   expired_material_batches?: number | string | null,
 *   low_stock_count?: number | string | null
 * }>} rows - Raw rows returned from the KPI summary SQL query.
 *
 * @returns {Array<{
 *   batchType: 'product' | 'packaging_material' | 'total',
 *   totalProducts: number,
 *   totalMaterials: number,
 *   locationsCount: number,
 *   totalQuantity: number,
 *   totalReserved: number,
 *   totalAvailable: number,
 *   nearExpiryInventoryRecords: number,
 *   expiredInventoryRecords: number,
 *   expiredProductBatches: number,
 *   expiredMaterialBatches: number,
 *   lowStockCount: number
 * }>}
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
 * into a normalized inventory summary object with derived stock and expiry information.
 *
 * Supports both product and packaging material inventory records and derives
 * display names and status flags used by the frontend inventory tables.
 *
 * @param {{
 *   item_id: string,
 *   item_type: 'product' | 'packaging_material',
 *   sku?: string | null,
 *   product_name?: string | null,
 *   brand_name?: string | null,
 *   series_name?: string | null,
 *   material_name?: string | null,
 *   material_code?: string | null,
 *   total_lots?: number | string | null,
 *   earliest_manufacture_date?: string | null,
 *   created_at?: string | null,
 *   [key: string]: any
 * }} row - Raw SQL result row from the location inventory summary query.
 *
 * @returns {{
 *   itemId: string,
 *   itemType: 'product' | 'packaging_material',
 *   displayName: string,
 *   totalLots: number,
 *   earliestManufactureDate: string | null,
 *   createdAt: string | null,
 *   isLowStock?: boolean,
 *   isNearExpiry?: boolean,
 *   expirySeverity?: 'normal' | 'warning' | 'critical' | 'expired'
 * }}
 * Transformed inventory summary object ready for frontend consumption.
 */
const transformLocationInventorySummaryRow = (row) => {
  const isProduct = row.item_type === 'product';
  const productName = getProductDisplayName({
    product_name: row.product_name ?? '',
    brand: row.brand_name ?? '',
    sku: row.sku ?? '',
    country_code: row.country_code ?? '',
    display_name: row.display_name ?? undefined,
  });
  const statusInfo = deriveInventoryStatusFlags(row);

  return cleanObject({
    itemId: row.item_id,
    itemType: isProduct ? 'product' : 'packaging_material',
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
 * Transform paginated location inventory summary rows into
 * structured frontend-ready objects.
 *
 * Responsibilities:
 * - Apply `transformLocationInventorySummaryRow` to each row
 * - Preserve pagination metadata
 *
 * @param {{
 *   data: [],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }} paginatedResult
 *
 * @returns {Promise<PaginatedResult<T>>}
 */
const transformPaginatedLocationInventorySummaryResult = (paginatedResult) =>
  transformPageResult(paginatedResult, transformLocationInventorySummaryRow);

/**
 * Transform a single raw location inventory summary record.
 *
 * @param {{
 *   location_inventory_id: string,
 *   batch_type: 'product' | 'packaging_material',
 *
 *   sku_id?: string | null,
 *   sku?: string | null,
 *
 *   material_id?: string | null,
 *   material_code?: string | null,
 *
 *   lot_number?: string | null,
 *
 *   product_manufacture_date?: string | null,
 *   material_manufacture_date?: string | null,
 *
 *   product_expiry_date?: string | null,
 *   material_expiry_date?: string | null,
 *
 *   location_quantity?: number | null,
 *   reserved_quantity?: number | null,
 *
 *   status_id?: string | null,
 *   status_name?: string | null,
 *   status_date?: string | null,
 *
 *   inbound_date?: string | null,
 *   outbound_date?: string | null,
 *   last_update?: string | null,
 *
 *   location_id?: string | null,
 *   location_name?: string | null,
 *   location_type?: string | null
 * }} row - Raw DB record returned from the location inventory summary query.
 *
 * @returns {{
 *   locationInventoryId: string,
 *   batchType: 'product' | 'packaging_material',
 *   item: {
 *     type: 'sku' | 'material',
 *     id: string | null,
 *     code: string | null
 *   },
 *   lotNumber: string | null,
 *   manufactureDate: string | null,
 *   expiryDate: string | null,
 *   quantity: {
 *     locationQuantity: number | null,
 *     reserved: number | null,
 *     available: number
 *   },
 *   status: {
 *     id: string | null,
 *     name: string | null,
 *     date: string | null
 *   },
 *   timestamps: {
 *     inboundDate: string | null,
 *     outboundDate: string | null,
 *     lastUpdate: string | null
 *   },
 *   durationInStorage: number | null,
 *   location: {
 *     id: string | null,
 *     name: string | null,
 *     type: string | null
 *   }
 * }} Transformed inventory summary details item.
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
 * Transforms a paginated location inventory summary details result
 * into structured objects for frontend consumption.
 *
 * Applies `transformLocationInventorySummaryDetailsItem` to each row
 * while preserving pagination metadata.
 *
 * @param {{
 *   data: [],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }} paginatedResult - Raw paginated SQL result
 *
 @returns {Promise<PaginatedResult<T>>}
 */
const transformPaginatedLocationInventorySummaryDetails = (paginatedResult) =>
  transformPageResult(
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
 * Transform paginated location inventory record rows into
 * structured inventory objects for frontend consumption.
 *
 * Responsibilities:
 * - Apply `transformLocationInventoryRecord` to each row
 * - Preserve pagination metadata
 *
 * @param {{
 *   data: [],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }} paginatedResult
 *
 * @returns {Promise<PaginatedResult<T>>}
 */
const transformPaginatedLocationInventoryRecordResults = (paginatedResult) =>
  transformPageResult(paginatedResult, transformLocationInventoryRecord);

/**
 * Transforms lightweight enriched location inventory records
 * (typically after insert or quantity adjustment) into a normalized response format.
 *
 * - Dynamically merges product or material info into a single `itemInfo` section.
 * - Normalizes for summary/confirmation UI.
 * - Strips null/undefined fields using `cleanObject`.
 *
 * @param {Array<Object>} rows - Raw DB rows from the location inventory join query.
 * @returns {Array<Object>} - Transformed summary records.
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
