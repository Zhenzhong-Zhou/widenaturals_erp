/**
 * @file bom-transformer.js
 * @description Row-level and page-level transformers for BOM records.
 *
 * Exports:
 *   - transformPaginatedOBoms              – transforms paginated BOM query results
 *   - transformBomDetails                  – transforms flat BOM detail rows into header + details
 *   - transformBOMProductionSummaryRows    – groups and transforms production summary rows by part
 *   - buildBOMProductionSummaryResponse    – builds the final API response shape for readiness reports
 *
 * Internal helpers (not exported):
 *   - transformBomRow – transforms a single paginated BOM row
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { getProductDisplayName } = require('../utils/display-name-utils');
const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * Transforms a single flat paginated BOM DB row into the UI-facing shape.
 *
 * @param {RawBOMRow} row
 * @returns {BOMRecord|null}
 */
const transformBomRow = (row) => {
  if (!row) return null;

  const productName = getProductDisplayName({
    product_name: row.product_name,
    brand: row.brand ?? '',
    sku: row.sku_code,
    country_code: row.country_code ?? '',
  });

  return cleanObject({
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
  });
};

/**
 * Transforms a paginated BOM result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformBomRow` via `transformPageResult`,
 * which preserves pagination metadata.
 *
 * @param {Object} paginatedResult
 * @param {RawBOMRow[]} paginatedResult.data
 * @param {Object} paginatedResult.pagination
 * @returns {Promise<PaginatedResult<RawBOMRow>>}
 */
const transformPaginatedOBoms = (paginatedResult) =>
  transformPageResult(paginatedResult, transformBomRow);

/**
 * Transforms flat BOM detail rows into a structured header + details object.
 *
 * Groups all rows under a single header (product, SKU, compliance, BOM) and maps
 * each row with a `bom_item_id` into a detail entry with part and audit metadata.
 * Returns `null` if the input is empty.
 *
 * @param {BomDetailsRow[]} rows
 * @returns {BomDetailResult|null}
 */
const transformBomDetails = (rows = []) => {
  if (!rows.length) return null;

  const headerRow = rows[0];

  const productName = getProductDisplayName({
    product_name: headerRow.product_name,
    brand: headerRow.brand ?? '',
    sku: headerRow.sku_code,
    country_code: headerRow.country_code ?? '',
  });

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
};

/**
 * Transforms raw BOM production summary rows into structured part summaries.
 *
 * Groups rows by `part_id`, accumulates batch-level data per part, then enriches
 * each part with representative display fields from the first available batch.
 *
 * @param {BOMProductionSummaryRow[]} rows
 * @returns {BOMPartSummary[]}
 */
const transformBOMProductionSummaryRows = (rows = []) => {
  if (!rows.length) return [];

  const grouped = new Map();

  // 1. Group by part_id and accumulate batch-level data.
  for (const row of rows) {
    const partId = row.part_id;

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

  // 2. Enrich each part with display fields derived from the first batch.
  for (const part of grouped.values()) {
    const firstBatch = part.materialBatches[0];
    part.packagingMaterialName = firstBatch?.materialName ?? null;
    part.materialSnapshotName = firstBatch?.materialSnapshotName ?? null;
    part.displayLabel = firstBatch?.receivedLabelName ?? part.partName;
  }

  return Array.from(grouped.values());
};

/**
 * Builds the standardised API response for a BOM production readiness report.
 *
 * Consumes the output of `getProductionReadinessReport()` and maps it into
 * the client-facing shape with `metadata` and `parts`.
 *
 * @param {string} bomId
 * @param {Object} readinessReport - Output of `getProductionReadinessReport()`.
 * @returns {Object} Structured readiness response.
 */
const buildBOMProductionSummaryResponse = (bomId, readinessReport) => {
  if (!readinessReport) {
    return { bomId, metadata: {}, parts: [] };
  }

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
