const {
  transformPaginatedResult,
  deriveInventoryStatusFlags, cleanObject,
} = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { differenceInDays } = require('date-fns');

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
  transformPaginatedResult(paginatedResult, transformLocationInventorySummaryRow);

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
    
    item: row.batch_type === 'product'
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
    manufactureDate: row.product_manufacture_date || row.material_manufacture_date,
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
  transformPaginatedResult(paginatedResult, transformLocationInventorySummaryDetailsItem);

/**
 * Transforms a single raw location inventory row into structured, display-ready data.
 * Dynamically handles both product and material item types.
 *
 * @param {Object} row - A raw DB row from the location inventory query
 * @returns {Object} Transformed and cleaned location inventory object
 */
const transformLocationInventoryRecord = (row) => {
  const itemType = row.item_type;
  const isProduct = itemType === 'product';
  const isMaterial = itemType === 'packaging_material';
  
  const displayName = isProduct
    ? getProductDisplayName(row)
    : row.material_name;
  
  const displayLotNumber = isProduct ? row.product_lot_number : row.material_lot_number;
  const displayManufactureDate = isProduct
    ? row.product_manufacture_date
    : row.material_manufacture_date;
  const displayExpiryDate = isProduct
    ? row.product_expiry_date
    : row.material_expiry_date;
  
  const statusFlags = deriveInventoryStatusFlags({
    quantity: row.location_quantity,
    expiryDate: displayExpiryDate,
  });
  
  const status = cleanObject({
    name: row.status_name,
    stockLevel: statusFlags.stockLevel,
    expirySeverity: statusFlags.expirySeverity,
  });
  
  return cleanObject({
    id: row.location_inventory_id,
    itemType,
    location: {
      id: row.location_id,
      name: row.location_name,
      type: row.location_type_name,
    },
    quantity: {
      available: row.location_quantity,
      reserved: row.reserved_quantity,
    },
    lot: {
      number: displayLotNumber,
      manufactureDate: displayManufactureDate,
      expiryDate: displayExpiryDate,
    },
    product: isProduct
      ? {
        name: row.product_name,
        brand: row.brand_name,
        sku: row.sku_code,
        barcode: row.barcode,
        language: row.language,
        countryCode: row.country_code,
        sizeLabel: row.size_label,
        manufacturer: row.product_manufacturer_name,
      }
      : undefined,
    material: isMaterial
      ? {
        name: row.material_name,
        code: row.material_code,
        color: row.material_color,
        size: row.material_size,
        unit: row.material_unit,
        supplier: row.material_supplier_name,
      }
      : undefined,
    part: row.part_name
      ? {
        name: row.part_name,
        code: row.part_code,
        type: row.part_type,
        unit: row.part_unit,
      }
      : undefined,
    createdBy: row.created_by_firstname || row.created_by_lastname
      ? `${row.created_by_firstname ?? ''} ${row.created_by_lastname ?? ''}`.trim()
      : null,
    updatedBy: row.updated_by_firstname || row.updated_by_lastname
      ? `${row.updated_by_firstname ?? ''} ${row.updated_by_lastname ?? ''}`.trim()
      : null,
    status,
    timestamps: {
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      inboundDate: row.inbound_date,
      outboundDate: row.outbound_date,
      lastUpdate: row.last_update,
    },
    display: {
      name: displayName,
    },
  });
};

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

module.exports = {
  transformLocationInventoryKpiSummary,
  transformPaginatedLocationInventorySummaryResult,
  transformPaginatedLocationInventorySummaryDetails,
  transformPaginatedLocationInventoryRecordResults,
};
