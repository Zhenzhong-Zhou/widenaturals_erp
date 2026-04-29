/**
 * @file bom-item-transformer.js
 * @description Row-level transformer for BOM material supply detail records.
 *
 * Exports:
 *   - transformBomMaterialSupplyDetails – converts flat SQL rows into structured
 *     nested BOM material supply objects (one entry per BOM item)
 *
 * Internal helpers (not exported):
 *   - RawBOMRow typedef – documents the flat query result shape
 */

'use strict';

const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

/**
 * Transforms flat SQL rows from `getBomMaterialSupplyDetailsById` into
 * structured nested BOM material supply objects.
 *
 * One entry is produced per unique `bom_item_id`. Each entry may have multiple
 * packaging materials, and each packaging material may have multiple supplier
 * batches — both are deduplicated by ID across rows.
 *
 * @param {RawBOMRow[]} rows - Raw rows returned from the SQL query.
 * @returns {Array<BomMaterialSupplyEntry>} Structured BOM material supply entries (one per BOM item).
 */
const transformBomMaterialSupplyDetails = (rows = []) => {
  if (!rows.length) return [];

  const resultMap = new Map();

  for (const row of rows) {
    const bomItemId = row.bom_item_id;

    // Initialise BOM item entry on first encounter.
    if (!resultMap.has(bomItemId)) {
      resultMap.set(bomItemId, {
        bomId: row.bom_id,
        bomItemId: row.bom_item_id,
        part: {
          id: row.part_id,
          name: row.part_name,
        },
        bomItemMaterial: {
          id: row.bom_item_material_id,
          requiredQtyPerProduct: Number(row.bom_required_qty ?? 0),
          unit: row.bom_item_material_unit,
          note: row.bom_item_material_note,
          status: makeStatus(row, {
            id: 'bom_item_material_status_id',
            name: 'bom_item_material_status',
            date: 'bom_item_material_status_date',
          }),
          audit: compactAudit(makeAudit(row, { prefix: 'bom_item_material_' })),
        },
        packagingMaterials: [],
      });
    }

    const bomEntry = resultMap.get(bomItemId);

    // Skip row if no packaging material is present.
    if (!row.packaging_material_id) continue;

    // Find existing packaging material entry or build a new one.
    let packagingMaterial = bomEntry.packagingMaterials.find(
      (m) => m.id === row.packaging_material_id
    );

    if (!packagingMaterial) {
      packagingMaterial = {
        id: row.packaging_material_id,
        name: row.packaging_material_name,
        code: row.packaging_material_code,
        color: row.packaging_material_color,
        size: row.packaging_material_size,
        grade: row.packaging_material_grade,
        materialComposition: row.packaging_material_composition,
        unit: row.packaging_material_unit,
        category: row.packaging_material_category,
        isVisibleForSalesOrder: !!row.is_visible_for_sales_order,
        estimatedUnitCost: Number(row.packaging_material_estimated_cost ?? 0),
        currency: row.packaging_material_currency,
        exchangeRate: Number(row.packaging_material_exchange_rate ?? 1),
        dimensions: {
          length_cm: Number(row.length_cm ?? 0),
          width_cm: Number(row.width_cm ?? 0),
          height_cm: Number(row.height_cm ?? 0),
          weight_g: Number(row.weight_g ?? 0),
          length_inch: Number(row.length_inch ?? 0),
          width_inch: Number(row.width_inch ?? 0),
          height_inch: Number(row.height_inch ?? 0),
          weight_lb: Number(row.weight_lb ?? 0),
        },
        status: makeStatus(row, {
          id: 'packaging_material_status_id',
          name: 'packaging_material_status',
          date: 'packaging_material_status_date',
        }),
        audit: compactAudit(makeAudit(row, { prefix: 'packaging_material_' })),
        supplier: row.supplier_id
          ? {
              id: row.supplier_id,
              name: row.supplier_name,
              contract: {
                unitCost: Number(row.supplier_contract_cost ?? 0),
                currency: row.supplier_currency,
                exchangeRate: Number(row.supplier_exchange_rate ?? 1),
                validFrom: row.valid_from,
                validTo: row.valid_to,
                isPreferred: !!row.is_preferred,
                leadTimeDays:
                  row.lead_time_days !== null
                    ? Number(row.lead_time_days)
                    : null,
                note: row.supplier_note,
              },
              audit: compactAudit(makeAudit(row, { prefix: 'supplier_link_' })),
              batches: [],
            }
          : null,
      };

      bomEntry.packagingMaterials.push(packagingMaterial);
    }

    // Append batch if present and not yet recorded for this supplier.
    if (row.packaging_material_batch_id && packagingMaterial.supplier) {
      const batchExists = packagingMaterial.supplier.batches.some(
        (b) => b.id === row.packaging_material_batch_id
      );

      if (!batchExists) {
        packagingMaterial.supplier.batches.push({
          id: row.packaging_material_batch_id,
          lotNumber: row.lot_number,
          materialSnapshotName: row.material_snapshot_name,
          receivedLabelName: row.received_label_name,
          manufactureDate: row.manufacture_date,
          expiryDate: row.expiry_date,
          quantity: Number(row.batch_quantity ?? 0),
          unit: row.batch_unit,
          unitCost: Number(row.batch_unit_cost ?? 0),
          currency: row.batch_currency,
          exchangeRate: Number(row.batch_exchange_rate ?? 1),
          totalCost: Number(row.batch_total_cost ?? 0),
          status: makeStatus(row, {
            id: 'batch_status_id',
            name: 'batch_status',
            date: 'batch_status_date',
          }),
          audit: compactAudit(makeAudit(row, { prefix: 'batch_' })),
        });
      }
    }
  }

  return Array.from(resultMap.values());
};

module.exports = {
  transformBomMaterialSupplyDetails,
};
