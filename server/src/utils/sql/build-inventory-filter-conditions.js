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

/**
 * Builds reusable SQL filter conditions and parameter bindings
 * based on shared inventory filters (e.g., SKU, product name, lot number).
 *
 * @param {Object} filters - Filters object
 * @param {Object} fieldMap - Mapping of logical keys to actual table. Column names
 * @param {string} fieldMap.prefix - Table alias prefix (e.g., 'li' or 'wi')
 * @returns {{ conditions: string[], params: any[] }}
 */
const buildInventoryFilterConditions = (filters, fieldMap) => {
  const conditions = [];
  const params = [];
  
  const {
    prefix,
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
    inboundDate,
    expiryDate,
    createdAt,
    status,
  } = filters;
  
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
  
  if (inboundDate && fieldMap.inboundDate) {
    params.push(inboundDate);
    conditions.push(`${fieldMap.inboundDate}::date = $${params.length}`);
  }
  
  if (expiryDate) {
    params.push(expiryDate);
    conditions.push(`
      (
        (br.batch_type = 'product' AND pb.expiry_date = $${params.length})
        OR
        (br.batch_type = 'packaging_material' AND pmb.expiry_date = $${params.length})
      )
    `);
  }
  
  if (status) {
    params.push(status);
    conditions.push(`st.name = $${params.length}`);
  }
  
  if (inboundDate && prefix) {
    params.push(inboundDate);
    conditions.push(`${prefix}.inbound_date::date = $${params.length}`);
  }
  
  if (createdAt && prefix) {
    params.push(createdAt);
    conditions.push(`${prefix}.created_at::date = $${params.length}`);
  }
  
  return { conditions, params };
};

module.exports = {
  buildInventoryFilterConditions,
};
