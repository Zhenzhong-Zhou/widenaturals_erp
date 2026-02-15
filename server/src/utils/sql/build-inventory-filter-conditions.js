/**
 * @fileoverview
 * Shared utility for building SQL WHERE clause fragments and parameter bindings
 * for both `location_inventory` and `warehouse_inventory` queries.
 *
 * This function abstracts common inventory filtering logic across both domains.
 * It supports dynamic text, date, and foreign-key–based filters tied to:
 * - SKU, product name, material name/code
 * - Lot number, inbound/expiry/created dates
 * - Part name/code/type
 * - Warehouse or location name
 * - Batch type (product or packaging_material)
 *
 * Table alias prefixing (e.g., 'li', 'wi') is supported for date-based filters
 * like `created_at` or `inbound_date` by passing `fieldMap.prefix`.
 *
 * Usage:
 *   const { conditions, params } = buildInventoryFilterConditions(filters, {
 *     prefix: 'wi',
 *     warehouseName: 'wh.name',
 *   });
 *
 *   const whereClause = [...coreConditions, ...conditions].join(' AND ');
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

/**
 * Builds reusable SQL filter conditions and parameter bindings
 * based on shared inventory filters (e.g., SKU, product name, lot number).
 *
 * @param {Object} filters - Filters object
 * @param {string} [filters.inboundAfter]
 * @param {string} [filters.inboundBefore]
 * @param {string} [filters.createdAfter]
 * @param {string} [filters.createdBefore]
 * @param {string} [filters.expiryAfter]
 * @param {string} [filters.expiryBefore]
 * @param {Object} fieldMap - Mapping of logical keys to actual table. Column names
 * @param {string} fieldMap.prefix - Table alias prefix (e.g., 'li' or 'wi')
 * @param {string} [fieldMap.locationName]
 * @param {string} [fieldMap.warehouseName]
 * @returns {{ conditions: string[], params: any[] }}
 */
const buildInventoryFilterConditions = (filters = {}, fieldMap = {}) => {
  const conditions = [];
  const params = [];

  // Normalize date-only filters once (works even if keys are missing)
  filters = normalizeDateRangeFilters(filters, 'inboundAfter', 'inboundBefore');
  filters = normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore');
  filters = normalizeDateRangeFilters(filters, 'expiryAfter', 'expiryBefore');

  const {
    warehouseName,
    locationName,
    batchType,
    sku,
    productName,
    materialName,
    materialCode,
    partCode,
    partName,
    partType,
    lotNumber,
    status,
  } = filters;

  const tablePrefix = fieldMap.prefix; // allow either, prefer fieldMap

  // --- Text filters ---
  if (locationName && fieldMap.locationName) {
    params.push(`%${locationName}%`);
    conditions.push(`${fieldMap.locationName} ILIKE $${params.length}`);
  }

  if (warehouseName && fieldMap.warehouseName) {
    params.push(`%${warehouseName}%`);
    conditions.push(`${fieldMap.warehouseName} ILIKE $${params.length}`);
  }

  if (batchType) {
    params.push(batchType);
    conditions.push(`br.batch_type = $${params.length}`);
  }

  if (sku) {
    params.push(`%${sku}%`);
    conditions.push(`s.sku ILIKE $${params.length}`);
  }

  if (productName) {
    params.push(`%${productName}%`);
    conditions.push(`p.name ILIKE $${params.length}`);
  }

  if (materialName) {
    params.push(`%${materialName}%`);
    conditions.push(`pmb.material_snapshot_name ILIKE $${params.length}`);
  }

  if (materialCode) {
    params.push(`%${materialCode}%`);
    conditions.push(`pm.code ILIKE $${params.length}`);
  }

  if (partCode) {
    params.push(`%${partCode}%`);
    conditions.push(`pt.code ILIKE $${params.length}`);
  }

  if (partName) {
    params.push(`%${partName}%`);
    conditions.push(`pt.name ILIKE $${params.length}`);
  }

  if (partType) {
    params.push(`%${partType}%`);
    conditions.push(`pt.type ILIKE $${params.length}`);
  }

  if (lotNumber) {
    params.push(`%${lotNumber}%`);
    conditions.push(`
      (
        (br.batch_type = 'product' AND pb.lot_number ILIKE $${params.length})
        OR
        (br.batch_type = 'packaging_material' AND pmb.lot_number ILIKE $${params.length})
      )
    `);
  }

  // --- Date filters (generic helper) ---
  // Because this function uses params.length indexing, we create a local ref synced to it.
  const paramIndexRef = { value: params.length + 1 };

  if (tablePrefix) {
    applyDateRangeConditions({
      conditions,
      params,
      column: `${tablePrefix}.inbound_date`,
      after: filters.inboundAfter,
      before: filters.inboundBefore,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: `${tablePrefix}.created_at`,
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
  }

  // Expiry is polymorphic (pb / pmb). We keep the same logic you had, but without ::date/interval.
  if (filters.expiryAfter || filters.expiryBefore) {
    // IMPORTANT: we must preserve the polymorphic OR grouping
    // and ensure placeholders align with params.
    const after = filters.expiryAfter;
    const before = filters.expiryBefore;

    if (after) {
      conditions.push(`
        (
          (br.batch_type = 'product' AND pb.expiry_date >= $${paramIndexRef.value})
          OR
          (br.batch_type = 'packaging_material' AND pmb.expiry_date >= $${paramIndexRef.value})
        )
      `);
      params.push(after);
      paramIndexRef.value++;
    }

    if (before) {
      conditions.push(`
        (
          (br.batch_type = 'product' AND pb.expiry_date < $${paramIndexRef.value})
          OR
          (br.batch_type = 'packaging_material' AND pmb.expiry_date < $${paramIndexRef.value})
        )
      `);
      params.push(before);
      paramIndexRef.value++;
    }
  }

  if (status) {
    params.push(status);
    conditions.push(`st.name = $${params.length}`);
  }

  return { conditions, params };
};

module.exports = {
  buildInventoryFilterConditions,
};
