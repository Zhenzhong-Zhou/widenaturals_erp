import type { WarehouseInventoryFilters } from '@features/warehouseInventory/state';
import { buildScopedInventoryFilters } from '@utils/filters/filter-utils.ts';

/**
 * Builds a cleaned and scoped set of warehouse inventory filters.
 *
 * Depending on the selected `batchType`, it removes fields that are not applicable
 * (e.g., product fields when filtering packaging materials, and vice versa),
 * then removes all undefined, null, or empty values.
 *
 * @param {WarehouseInventoryFilters} form - Raw filter object from UI or query params
 * @returns {WarehouseInventoryFilters} - Sanitized and type-scoped filter object
 */
export const buildWarehouseInventoryFilters = (
  form: WarehouseInventoryFilters
): WarehouseInventoryFilters =>
  buildScopedInventoryFilters(form, {
    productFields: ['productName', 'sku'],
    packagingMaterialFields: [
      'materialName',
      'materialCode',
      'partName',
      'partCode',
      'partType',
    ],
  }) as WarehouseInventoryFilters;
