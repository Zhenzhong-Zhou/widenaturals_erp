const { getProductDisplayName } = require('../utils/display-name-utils');
const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * @typedef {Object} ComplianceInfo
 * @property {string|null} id - UUID of the compliance record.
 * @property {string|null} type - Compliance type (e.g., 'NPN', 'FDA').
 * @property {string|null} number - Compliance or license number.
 * @property {string|null} status - Human-readable compliance status name.
 * @property {string|null} issuedDate - Date the compliance was issued (ISO string).
 * @property {string|null} expiryDate - Date the compliance expires (ISO string).
 */

/**
 * @typedef {Object} ProductInfo
 * @property {string} id - Product UUID.
 * @property {string} name - Product display name.
 * @property {string|null} brand - Product brand.
 * @property {string|null} series - Product series.
 * @property {string|null} category - Product category.
 */

/**
 * @typedef {Object} SKUInfo
 * @property {string} id - SKU UUID.
 * @property {string} code - SKU code (unique per variant).
 * @property {string|null} barcode - SKU barcode string.
 * @property {string|null} language - Language code (e.g., 'en', 'fr').
 * @property {string|null} countryCode - Country code (e.g., 'CA', 'US').
 * @property {string|null} marketRegion - Market region name.
 * @property {string|null} sizeLabel - SKU size label (e.g., "60 Capsules").
 * @property {string|null} description - SKU-level description.
 * @property {ComplianceInfo|null} compliance - Linked compliance record.
 */

/**
 * @typedef {Object} BOMStatus
 * @property {string|null} id - UUID of BOM status.
 * @property {string|null} name - Status name (e.g., 'Active', 'Draft').
 * @property {string|null} date - Date when this status was applied (ISO string).
 */

/**
 * @typedef {Object} BOMAudit
 * @property {string} createdAt - Timestamp when the BOM was created.
 * @property {{ id: string, name: string }} createdBy - User who created the BOM.
 * @property {string|null} updatedAt - Timestamp when BOM was last updated.
 * @property {{ id: string, name: string }|null} updatedBy - User who last updated the BOM, or null.
 */

/**
 * @typedef {Object} BOMInfo
 * @property {string} id - BOM UUID.
 * @property {string} code - BOM code (e.g., 'BOM-CH-HN100-R-CN').
 * @property {string} name - Human-readable BOM name.
 * @property {number} revision - Revision number.
 * @property {boolean} isActive - Whether the BOM is active.
 * @property {boolean} isDefault - Whether this BOM is the default for its SKU.
 * @property {string|null} description - BOM description text.
 * @property {BOMStatus} status - Current BOM status info.
 * @property {BOMAudit} audit - Audit information (created/updated metadata).
 */

/**
 * @typedef {Object} BOMRecord
 * @property {ProductInfo} product - Product-level details.
 * @property {SKUInfo} sku - SKU-level details, including compliance info.
 * @property {BOMInfo} bom - BOM-level information and audit details.
 */

/**
 * @typedef {Object} RawBOMRow
 * @property {string} product_id
 * @property {string} product_name
 * @property {string} brand
 * @property {string} series
 * @property {string} category
 * @property {string} sku_id
 * @property {string} sku_code
 * @property {string} barcode
 * @property {string} language
 * @property {string} country_code
 * @property {string} market_region
 * @property {string} size_label
 * @property {string} sku_description
 * @property {string|null} compliance_id
 * @property {string|null} compliance_type
 * @property {string|null} compliance_number
 * @property {string|null} compliance_status
 * @property {string|null} compliance_issued_date
 * @property {string|null} compliance_expiry_date
 * @property {string} bom_id
 * @property {string} bom_code
 * @property {string} bom_name
 * @property {number} bom_revision
 * @property {boolean} is_active
 * @property {boolean} is_default
 * @property {string|null} bom_description
 * @property {string|null} bom_status_id
 * @property {string|null} bom_status
 * @property {string|null} bom_status_date
 * @property {string} bom_created_at
 * @property {string} bom_created_by
 * @property {string|null} bom_created_by_firstname
 * @property {string|null} bom_created_by_lastname
 * @property {string|null} bom_updated_at
 * @property {string|null} bom_updated_by
 * @property {string|null} bom_updated_by_firstname
 * @property {string|null} bom_updated_by_lastname
 */

/**
 * Transform a single flat SQL BOM row into a structured object.
 *
 * Converts flattened joined columns from `getPaginatedBoms()` into nested objects
 * grouped by `product`, `sku`, and `bom`, each with clearly named sub-properties.
 *
 * @param {RawBOMRow} row - Flat SQL result row from the paginated BOM query.
 * @returns {BOMRecord|null} Structured BOM record or null if invalid.
 */
const transformBomRow = (row) => {
  if (!row) return null;

  const productName = getProductDisplayName(row);

  const base = {
    product: {
      id: row.product_id,
      name: productName,
      brand: row.brand,
      series: row.series,
      category: row.category,
    },
    sku: {
      id: row.sku_id,
      code: row.sku_code,
      barcode: row.barcode,
      language: row.language,
      countryCode: row.country_code,
      marketRegion: row.market_region,
      sizeLabel: row.size_label,
      description: row.sku_description,
      compliance: cleanObject({
        id: row.compliance_id,
        type: row.compliance_type,
        number: row.compliance_number,
        status: row.compliance_status,
        issuedDate: row.compliance_issued_date,
        expiryDate: row.compliance_expiry_date,
      }),
    },
    bom: {
      id: row.bom_id,
      code: row.bom_code,
      name: row.bom_name,
      revision: row.bom_revision,
      isActive: row.is_active,
      isDefault: row.is_default,
      description: row.bom_description,
      status: makeStatus(row, {
        id: 'bom_status_id',
        name: 'bom_status',
        date: 'bom_status_date',
      }),
      audit: compactAudit(makeAudit(row, { prefix: 'bom_' })),
    },
  };

  return cleanObject(base);
};

/**
 * Transform paginated BOM query results into structured BOM objects
 * with attached pagination metadata.
 *
 * @param {{
 *   rows: Object[],
 *   pagination: { page: number, limit: number, totalRecords: number, totalPages: number }
 * }} paginatedResult - Raw result from `paginateQuery()`.
 *
 * @returns {{
 *   data: BOMRecord[],
 *   pagination: { page: number, limit: number, totalRecords: number, totalPages: number }
 * }} Transformed BOM list with pagination info.
 */
const transformPaginatedOBoms = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformBomRow(row)
  );
};

/**
 * @typedef {Object} BomDetailsRow
 * Represents a single flat SQL result row for a BOM detail query,
 * combining product, SKU, compliance, BOM, BOM item, and part info.
 *
 * @property {string} product_id
 * @property {string} product_name
 * @property {string|null} brand
 * @property {string|null} series
 * @property {string|null} category
 * @property {string} sku_id
 * @property {string} sku_code
 * @property {string|null} barcode
 * @property {string|null} language
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string|null} size_label
 * @property {string|null} sku_description
 * @property {string|null} compliance_id
 * @property {string|null} compliance_type
 * @property {string|null} compliance_number
 * @property {string|null} compliance_issued_date
 * @property {string|null} compliance_expiry_date
 * @property {string|null} compliance_description
 * @property {string|null} compliance_status_id
 * @property {string|null} compliance_status
 * @property {string} bom_id
 * @property {string} bom_code
 * @property {string} bom_name
 * @property {number} bom_revision
 * @property {boolean} bom_is_active
 * @property {boolean} bom_is_default
 * @property {string|null} bom_description
 * @property {string|null} bom_status_id
 * @property {string|null} bom_status
 * @property {Date|null} bom_status_date
 * @property {Date|null} bom_created_at
 * @property {string|null} bom_created_by
 * @property {string|null} bom_created_by_firstname
 * @property {string|null} bom_created_by_lastname
 * @property {Date|null} bom_updated_at
 * @property {string|null} bom_updated_by
 * @property {string|null} bom_updated_by_firstname
 * @property {string|null} bom_updated_by_lastname
 * @property {string|null} bom_item_id
 * @property {string|null} part_qty_per_product
 * @property {string|null} unit
 * @property {string|null} specifications
 * @property {string|null} estimated_unit_cost
 * @property {string|null} currency
 * @property {number} exchange_rate
 * @property {string|null} note
 * @property {Date|null} bom_item_created_at
 * @property {string|null} bom_item_created_by
 * @property {string|null} bom_item_created_by_firstname
 * @property {string|null} bom_item_created_by_lastname
 * @property {Date|null} bom_item_updated_at
 * @property {string|null} bom_item_updated_by
 * @property {string|null} bom_item_updated_by_firstname
 * @property {string|null} bom_item_updated_by_lastname
 * @property {string|null} part_id
 * @property {string|null} part_code
 * @property {string|null} part_name
 * @property {string|null} part_type
 * @property {string|null} unit_of_measure
 * @property {string|null} part_description
 */

/**
 * Transform flat BOM detail rows into a structured nested object:
 * Product → SKU → Compliance → BOM → BOM Items (each with Part + Audit metadata)
 *
 * @param {BomDetailsRow[]} rows - Raw rows from the database query.
 * @returns {{
 *   header: object,
 *   details: object[]
 * } | null} Structured BOM detail object, or null if no records.
 */
const transformBomDetails = (rows = []) => {
  if (!rows || rows.length === 0) return null;

  try {
    const headerRow = rows[0];
    const productName = getProductDisplayName(headerRow);

    // --- Header section ---
    const header = {
      product: {
        id: headerRow.product_id,
        name: productName,
        brand: headerRow.brand,
        series: headerRow.series,
        category: headerRow.category,
      },
      sku: {
        id: headerRow.sku_id,
        code: headerRow.sku_code,
        barcode: headerRow.barcode,
        language: headerRow.language,
        countryCode: headerRow.country_code,
        marketRegion: headerRow.market_region,
        sizeLabel: headerRow.size_label,
        description: headerRow.sku_description,
      },
      compliance: headerRow.compliance_id
        ? {
            id: headerRow.compliance_id,
            type: headerRow.compliance_type,
            number: headerRow.compliance_number,
            issuedDate: headerRow.compliance_issued_date,
            expiryDate: headerRow.compliance_expiry_date,
            description: headerRow.compliance_description,
            status: {
              id: headerRow.compliance_status_id,
              name: headerRow.compliance_status,
            },
          }
        : null,
      bom: {
        id: headerRow.bom_id,
        code: headerRow.bom_code,
        name: headerRow.bom_name,
        revision: Number(headerRow.bom_revision ?? 1),
        isActive: Boolean(headerRow.bom_is_active),
        isDefault: Boolean(headerRow.bom_is_default),
        description: headerRow.bom_description,
        status: makeStatus(headerRow, {
          id: 'bom_status_id',
          name: 'bom_status',
          date: 'bom_status_date',
        }),

        audit: compactAudit(makeAudit(headerRow, { prefix: 'bom_' })),
      },
    };

    // --- Details section ---
    const details = rows
      .filter((r) => r.bom_item_id)
      .map((r) => ({
        id: r.bom_item_id,
        partQtyPerProduct: r.part_qty_per_product
          ? Number(r.part_qty_per_product)
          : null,
        unit: r.unit,
        specifications: r.specifications,
        estimatedUnitCost: r.estimated_unit_cost
          ? Number(r.estimated_unit_cost)
          : null,
        currency: r.currency,
        exchangeRate: r.exchange_rate ? Number(r.exchange_rate) : 1,
        note: r.note,
        part: {
          id: r.part_id,
          code: r.part_code,
          name: r.part_name,
          type: r.part_type,
          unitOfMeasure: r.unit_of_measure,
          description: r.part_description,
        },
        audit: compactAudit(makeAudit(r, { prefix: 'bom_item_' })),
      }));

    return { header, details };
  } catch (error) {
    logSystemException(error, 'Error transforming BOM details', {
      context: 'transformBomDetails',
    });

    throw AppError.transformerError('Failed to transform BOM details', {
      context: 'transformBomDetails',
    });
  }
};

/**
 * @typedef {Object} MaterialBatch
 * Represents a batch-level detail for a packaging material used in a BOM part.
 *
 * @property {string} materialName - The display name of the packaging material.
 * @property {string|null} materialSnapshotName - Snapshot name captured when batch was created.
 * @property {string|null} receivedLabelName - Label name provided by supplier.
 * @property {string|null} lotNumber - Batch or lot number identifier.
 * @property {number} batchQuantity - Original batch quantity.
 * @property {number} warehouseQuantity - Current warehouse quantity.
 * @property {number} reservedQuantity - Currently reserved quantity.
 * @property {number} availableQuantity - Quantity available for production.
 * @property {string|null} inventoryStatus - Status label (e.g. 'in_stock', 'available').
 * @property {string|null} warehouseName - Name of the warehouse where the batch is stored.
 * @property {string|null} supplierName - Name of the supplier associated with the batch.
 * @property {string|null} inboundDate - ISO timestamp for when the batch arrived.
 * @property {string|null} outboundDate - ISO timestamp for when the batch was shipped out.
 * @property {string|null} lastUpdate - ISO timestamp of the last quantity update.
 * @property {boolean} [isInactiveBatch=false] - Indicates whether the batch is marked inactive.
 * @property {boolean} [isUsableForProduction=true] - Optional flag denoting if the batch is usable for production.
 */

/**
 * @typedef {Object} BOMProductionSummaryRow
 * Represents a single raw SQL result row from `getBOMProductionSummary`.
 *
 * @property {string} part_id - ID of the BOM part.
 * @property {string} part_name - Name of the part (e.g., 'Bottle', 'Cap').
 * @property {number} required_qty_per_unit - Required quantity of the material per product.
 * @property {number} total_available_quantity - Total available quantity across warehouses.
 * @property {number|null} max_producible_units - Computed number of producible product units.
 * @property {boolean} is_shortage - Whether available quantity is insufficient.
 * @property {number} shortage_qty - Difference between required and available quantity.
 * @property {string|null} packaging_material_batch_id - ID of the packaging material batch.
 * @property {string|null} material_name - Name of the packaging material.
 * @property {string|null} material_snapshot_name - Material snapshot name (if available).
 * @property {string|null} received_label_name - Supplier label name (if any).
 * @property {string|null} lot_number - Lot number for the batch.
 * @property {number|null} batch_quantity - Total quantity for the batch.
 * @property {number|null} warehouse_quantity - Current quantity in warehouse.
 * @property {number|null} reserved_quantity - Reserved portion of warehouse quantity.
 * @property {number|null} available_quantity - Quantity available for production.
 * @property {string|null} inventory_status - Status of the batch inventory.
 * @property {string|null} warehouse_name - Name of the warehouse storing the batch.
 * @property {string|null} supplier_name - Supplier associated with the batch.
 * @property {string|null} inbound_date - Inbound timestamp for the batch.
 * @property {string|null} outbound_date - Outbound timestamp for the batch.
 * @property {string|null} last_update - Timestamp of last modification.
 */

/**
 * @typedef {Object} BOMPartSummary
 * Represents a structured summary of a single BOM part with its related batches.
 *
 * @property {string} partId - UUID of the part.
 * @property {string} partName - Name of the part.
 * @property {number} requiredQtyPerUnit - Required material quantity per product unit.
 * @property {number} totalAvailableQuantity - Total available quantity of material.
 * @property {number|null} maxProducibleUnits - Computed producible units based on availability.
 * @property {boolean} isShortage - Indicates if available stock is below required threshold.
 * @property {number} shortageQty - Shortage amount if any.
 * @property {MaterialBatch[]} materialBatches - List of detailed batch records.
 */

/**
 * Transforms raw BOM production summary rows into structured BOM part summaries.
 *
 * Groups SQL result rows by `part_id`, then aggregates associated batch-level data
 * (each representing a specific material batch used in the part). Adds convenience
 * fields such as `packagingMaterialName`, `materialSnapshotName`, and `displayLabel`
 * derived from the first available batch entry for UI and reporting use.
 *
 * Intended for use directly after `getBOMProductionSummary()` repository output.
 *
 * @function
 * @param {BOMProductionSummaryRow[]} [rows=[]] - Raw SQL rows returned from `getBOMProductionSummary`.
 * @returns {BOMPartSummary[]} Structured array of BOM part summaries ready for business logic
 * and API response building.
 *
 * @example
 * const rawRows = await getBOMProductionSummary(bomId);
 * const summary = transformBOMProductionSummaryRows(rawRows);
 * console.dir(summary, { depth: null });
 *
 * // Example output:
 * // [
 * //   {
 * //     partId: 'f11929e0-15de-48e2-b680-69d615fce175',
 * //     partName: 'Bottle',
 * //     requiredQtyPerUnit: 1,
 * //     totalAvailableQuantity: 250,
 * //     maxProducibleUnits: 250,
 * //     isShortage: false,
 * //     shortageQty: 0,
 * //     packagingMaterialName: '250ml Plastic Bottle',
 * //     materialSnapshotName: 'Bottle Snapshot v1',
 * //     displayLabel: '250ml Bottle - Clear',
 * //     materialBatches: [
 * //       {
 * //         materialName: '250ml Plastic Bottle',
 * //         lotNumber: 'PMB-LOT-1001',
 * //         warehouseName: 'Main Warehouse',
 * //         supplierName: 'Supplier X',
 * //         availableQuantity: 125,
 * //         inventoryStatus: 'in_stock',
 * //         inboundDate: '2025-05-01T10:00:00.000Z'
 * //       },
 * //       ...
 * //     ]
 * //   }
 * // ]
 */
const transformBOMProductionSummaryRows = (rows = []) => {
  if (!rows?.length) return [];

  const grouped = new Map();

  // ──────────────────────────────────────────────
  // 1. Group by part_id and accumulate batch-level data
  // ──────────────────────────────────────────────
  for (const row of rows) {
    const partId = row.part_id;

    // Initialize group if first time encountering this part
    if (!grouped.has(partId)) {
      grouped.set(partId, {
        partId,
        partName: row.part_name,
        requiredQtyPerUnit: Number(row.required_qty_per_unit) || 0,
        totalAvailableQuantity: Number(row.total_available_quantity) || 0,
        maxProducibleUnits:
          row.max_producible_units !== null
            ? Number(row.max_producible_units)
            : null,
        isShortage: Boolean(row.is_shortage),
        shortageQty: Number(row.shortage_qty) || 0,
        materialBatches: [],
      });
    }

    // Append material batch info (if present)
    if (row.material_name || row.lot_number) {
      grouped.get(partId).materialBatches.push(
        cleanObject({
          materialBatchId: row.packaging_material_batch_id,
          materialName: row.material_name,
          materialSnapshotName: row.material_snapshot_name,
          receivedLabelName: row.received_label_name,
          lotNumber: row.lot_number,
          batchQuantity: Number(row.batch_quantity) || 0,
          warehouseQuantity: Number(row.warehouse_quantity) || 0,
          reservedQuantity: Number(row.reserved_quantity) || 0,
          availableQuantity: Number(row.available_quantity) || 0,
          inventoryStatus: row.inventory_status,
          warehouseName: row.warehouse_name,
          supplierName: row.supplier_name,
          inboundDate: row.inbound_date,
          outboundDate: row.outbound_date,
          lastUpdate: row.last_update,
        })
      );
    }
  }

  // ──────────────────────────────────────────────
  // 2. Enrich each part with representative display fields
  //    (derived from the first material batch if available)
  // ──────────────────────────────────────────────
  for (const part of grouped.values()) {
    const firstBatch = part.materialBatches[0];
    part.packagingMaterialName = firstBatch?.materialName ?? null;
    part.materialSnapshotName = firstBatch?.materialSnapshotName ?? null;
    part.displayLabel = firstBatch?.receivedLabelName ?? part.partName;
  }

  return Array.from(grouped.values());
};

/**
 * Builds a standardized API response object for a BOM Production Readiness report.
 *
 * Consumes the structured output of `getProductionReadinessReport()` and converts it
 * into a client-friendly response matching the `BomProductionReadinessData` shape.
 *
 * The resulting object includes:
 *  - **metadata:** Summary-level readiness metrics (status, max units, bottlenecks, etc.).
 *  - **parts:** Flattened per-part readiness records with detailed stock and shortage data.
 *
 * @function
 * @param {string} bomId - Unique identifier of the BOM for which readiness is generated.
 * @param {object} readinessReport - The report object returned by `getProductionReadinessReport()`.
 * @returns {object} Structured API response conforming to `BomProductionReadinessData`,
 *                   containing both high-level metadata and detailed part readiness info.
 *
 * @example
 * const readinessReport = getProductionReadinessReport(bomSummary);
 * const response = buildBOMProductionSummaryResponse(
 *   'cbbf2680-2730-4cb1-a38e-ce32f93609c1',
 *   readinessReport
 * );
 *
 * console.log(response.metadata.maxProducibleUnits);
 * // → 18
 */
const buildBOMProductionSummaryResponse = (bomId, readinessReport) => {
  if (!readinessReport) {
    return { bomId, metadata: {}, parts: [] };
  }

  // Extract bottleneck parts for quick reference in metadata
  const bottleneckParts =
    readinessReport.summary
      ?.filter((p) => p.isBottleneck)
      ?.map((p) => ({
        partId: p.partId,
        partName: p.partName,
        packagingMaterialName: p.packagingMaterialName ?? null,
        materialSnapshotName: p.materialSnapshotName ?? null,
        displayLabel: p.displayLabel ?? p.partName,
      })) ?? [];

  return {
    bomId,
    metadata: {
      generatedAt: readinessReport.generatedAt,
      isReadyForProduction: readinessReport.isReadyForProduction,
      maxProducibleUnits: readinessReport.maxProducibleUnits,
      bottleneckParts,
      stockHealth: readinessReport.stockHealth,
      shortageCount: readinessReport.shortageParts?.length ?? 0,
    },
    parts: readinessReport.summary || [],
  };
};

module.exports = {
  transformPaginatedOBoms,
  transformBomDetails,
  transformBOMProductionSummaryRows,
  buildBOMProductionSummaryResponse,
};
