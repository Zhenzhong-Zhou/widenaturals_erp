/**
 * @fileoverview
 * BOM Item Transformer Module
 *
 * Provides transformation utilities to convert flat SQL query results into
 * structured, hierarchical BOM-related data objects.
 *
 * Typical transformations include:
 *  - BOM item composition with part and material details
 *  - Supplier and batch association for packaging materials
 *  - Cost and status enrichment for reporting and analytics
 */

const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

/**
 * @typedef {Object} RawBOMRow
 * @property {string} bom_id
 * @property {string} bom_item_id
 * @property {string} part_id
 * @property {string} part_name
 *
 * @property {string|null} bom_item_material_id
 * @property {number|null} bom_required_qty
 * @property {string|null} bom_item_material_unit
 * @property {string|null} bom_item_material_note
 * @property {string|null} bom_item_material_status_id
 * @property {string|null} bom_item_material_status
 * @property {Date|null} bom_item_material_status_date
 * @property {Date|null} bom_item_material_created_by
 * @property {string|null} bom_item_material_created_firstname
 * @property {string|null} bom_item_material_created_lastname
 * @property {Date|null} bom_item_material_updated_by
 * @property {string|null} bom_item_material_updated_firstname
 * @property {string|null} bom_item_material_updated_lastname
 * @property {Date|null} bom_item_material_created_at
 * @property {Date|null} bom_item_material_updated_at
 *
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_name
 * @property {string|null} packaging_material_code
 * @property {string|null} packaging_material_color
 * @property {string|null} packaging_material_size
 * @property {string|null} packaging_material_grade
 * @property {string|null} packaging_material_composition
 * @property {string|null} packaging_material_unit
 * @property {string|null} packaging_material_category
 * @property {boolean|null} is_visible_for_sales_order
 * @property {number|null} packaging_material_estimated_cost
 * @property {string|null} packaging_material_currency
 * @property {number|null} packaging_material_exchange_rate
 * @property {number|null} length_cm
 * @property {number|null} width_cm
 * @property {number|null} height_cm
 * @property {number|null} weight_g
 * @property {number|null} length_inch
 * @property {number|null} width_inch
 * @property {number|null} height_inch
 * @property {number|null} weight_lb
 * @property {string|null} packaging_material_status_id
 * @property {string|null} packaging_material_status
 * @property {Date|null} packaging_material_status_date
 * @property {Date|null} packaging_material_created_by
 * @property {string|null} packaging_material_created_firstname
 * @property {string|null} packaging_material_created_lastname
 * @property {Date|null} packaging_material_updated_by
 * @property {string|null} packaging_material_updated_firstname
 * @property {string|null} packaging_material_updated_lastname
 * @property {Date|null} packaging_material_created_at
 * @property {Date|null} packaging_material_updated_at
 *
 * @property {string|null} supplier_id
 * @property {string|null} supplier_name
 * @property {number|null} supplier_contract_cost
 * @property {string|null} supplier_currency
 * @property {number|null} supplier_exchange_rate
 * @property {Date|null} valid_from
 * @property {Date|null} valid_to
 * @property {boolean|null} is_preferred
 * @property {number|null} lead_time_days
 * @property {string|null} supplier_note
 * @property {Date|null} supplier_link_created_by
 * @property {string|null} supplier_link_created_firstname
 * @property {string|null} supplier_link_created_lastname
 * @property {string|null} supplier_link_updated_by
 * @property {string|null} supplier_link_updated_firstname
 * @property {string|null} supplier_link_updated_lastname
 * @property {Date|null} supplier_link_created_at
 * @property {Date|null} supplier_link_updated_at
 *
 * @property {string|null} packaging_material_batch_id
 * @property {string|null} lot_number
 * @property {string|null} material_snapshot_name
 * @property {string|null} received_label_name
 * @property {Date|null} manufacture_date
 * @property {Date|null} expiry_date
 * @property {number|null} batch_quantity
 * @property {string|null} batch_unit
 * @property {number|null} batch_unit_cost
 * @property {string|null} batch_currency
 * @property {number|null} batch_exchange_rate
 * @property {number|null} batch_total_cost
 * @property {string|null} batch_status_id
 * @property {string|null} batch_status
 * @property {Date|null} batch_status_date
 * @property {Date|null} batch_created_by
 * @property {string|null} batch_created_firstname
 * @property {string|null} batch_created_lastname
 * @property {string|null} batch_updated_by
 * @property {string|null} batch_updated_firstname
 * @property {string|null} batch_updated_lastname
 * @property {Date|null} batch_created_at
 * @property {Date|null} batch_updated_at
 */

/**
 * Transform flat SQL rows from `getBomMaterialSupplyDetailsById()` into
 * structured nested BOM Material Supply objects.
 *
 * @param {RawBOMRow[]} rows - Raw rows returned from the SQL query.
 * @returns {Array<Object>} Structured BOM material details (one per BOM item).
 */
const transformBomMaterialSupplyDetails = (rows = []) => {
  if (!rows?.length) return [];

  const resultMap = new Map();

  for (const row of rows) {
    const bomItemId = row.bom_item_id;

    // Initialize BOM item if not present in map
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
          audit: compactAudit(
            makeAudit(row, { prefix: 'bom_item_material_' })
          ),
        },
        packagingMaterials: [],
      });
    }

    // --- Build packaging material ---
    const packagingMaterial = {
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
      audit: compactAudit(
        makeAudit(row, { prefix: 'packaging_material_' })
      ),
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
              leadTimeDays: row.lead_time_days
                ? Number(row.lead_time_days)
                : null,
              note: row.supplier_note,
            },
          audit: compactAudit(
            makeAudit(row, { prefix: 'supplier_link_' })
          ),
          batches: [],
        }
        : null,
    };

    // --- Add batch if available ---
    if (row.packaging_material_batch_id && packagingMaterial.supplier) {
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
        audit: compactAudit(
          makeAudit(row, { prefix: 'batch_' })
        ),
      });
    }

    // --- Attach material to BOM entry ---
    const bomEntry = resultMap.get(bomItemId);
    const exists = bomEntry.packagingMaterials.some(
      (m) => m.id === packagingMaterial.id
    );
    if (!exists) bomEntry.packagingMaterials.push(packagingMaterial);
  }

  return Array.from(resultMap.values());
};

module.exports = {
  transformBomMaterialSupplyDetails,
};
