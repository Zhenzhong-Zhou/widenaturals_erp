import type { LocationInventoryFilters } from "@features/locationInventory/state";
import { cleanObject } from '@utils/objectUtils.ts';

/**
 * Prepares a sanitized set of location inventory filters based on the batch type.
 *
 * Removes conflicting or irrelevant fields depending on whether the filters are for
 * 'product' or 'packaging_material' inventory, then returns a cleaned object.
 *
 * @param {LocationInventoryFilters} form - The raw filter input object (usually from the UI form or query params)
 * @returns {LocationInventoryFilters} - A cleaned and scoped filter object with only relevant fields
 */
export const buildLocationInventoryFilters = (
  form: LocationInventoryFilters
): LocationInventoryFilters => {
  const { batchType, ...rest } = form;
  
  const fieldGroups = {
    product: ['productName', 'sku'],
    packaging_material: [
      'materialName',
      'materialCode',
      'materialType',
      'partName',
      'partCode',
      'partType',
    ],
  };
  
  const excludedFields =
    batchType === 'product'
      ? fieldGroups.packaging_material
      : batchType === 'packaging_material'
        ? fieldGroups.product
        : [];
  
  const cleaned = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !excludedFields.includes(key))
  );
  
  return cleanObject({ batchType, ...cleaned });
};
