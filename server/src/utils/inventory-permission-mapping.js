/**
 * Defines allowed filter keys based on the user's inventory access scope.
 *
 * - `full`: unrestricted filter access
 * - `product`: can filter by associated products, SKUs, batches, warehouse/location scope
 * - `sku`: narrower access; filters by associated SKUs and derived batches
 * - `batch`: lowest granularity; only filter by batch/location/warehouse
 * - `warehouse`: scoped to warehouse(s), but may also use product/SKU/batch to narrow results
 * - `location`: scoped to location(s), with optional product/SKU/batch filters
 * - `base`: no filter usage allowed
 */
const PERMISSION_FILTERS_MAP = {
  full: ['*'],
  product: ['productIds', 'skuIds', 'batchIds', 'locationIds', 'warehouseIds'],
  sku: ['skuIds', 'batchIds', 'locationIds', 'warehouseIds'],
  batch: ['batchIds', 'locationIds', 'warehouseIds'],
  packing_material: ['packingMaterialIds', 'locationIds', 'warehouseIds'],
  warehouse: [
    'warehouseIds', 'productIds', 'skuIds', 'batchIds',
    'packingMaterialIds'
  ],
  location: [
    'locationIds', 'productIds', 'skuIds', 'batchIds',
    'packingMaterialIds'
  ],
  base: [],
};

module.exports = {
  PERMISSION_FILTERS_MAP
};
