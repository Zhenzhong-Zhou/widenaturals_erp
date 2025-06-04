import type { LocationInventoryFilters } from "@features/locationInventory/state";
import { buildScopedInventoryFilters } from "./filter-utils";

/**
 * Builds a cleaned and scoped set of location inventory filters.
 *
 * Depending on the selected `batchType`, it removes fields that are not applicable
 * (e.g., product fields when filtering packaging materials, and vice versa),
 * then removes all undefined, null, or empty values.
 *
 * @param {LocationInventoryFilters} form - Raw filter object from UI or query params
 * @returns {LocationInventoryFilters} - Sanitized and type-scoped filter object
 */
export const buildLocationInventoryFilters = (
  form: LocationInventoryFilters
): LocationInventoryFilters =>
  buildScopedInventoryFilters(form, {
    productFields: ['productName', 'sku'],
    packagingMaterialFields: [
      'materialName',
      'materialCode',
      'partName',
      'partCode',
      'partType',
    ],
  }) as LocationInventoryFilters;
