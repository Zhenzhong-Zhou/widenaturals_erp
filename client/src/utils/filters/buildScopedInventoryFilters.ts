import { cleanObject } from '@utils/objectUtils';

/**
 * Generic utility to build cleaned and scoped inventory filters.
 *
 * Removes conflicting or irrelevant fields depending on the batchType ('product' or 'packaging_material'),
 * and strips undefined/null/empty values.
 *
 * @template T
 * @param form - Raw filter form input
 * @param options - Field groups to exclude depending on batchType
 * @returns {Partial<T>} - Cleaned and scoped filter object
 */
export const buildScopedInventoryFilters = <T extends { batchType?: string }>(
  form: T,
  {
    productFields,
    packagingMaterialFields,
  }: {
    productFields: (keyof T)[];
    packagingMaterialFields: (keyof T)[];
  }
): Partial<T> => {
  const { batchType, ...rest } = form;

  const excludedFields =
    batchType === 'product'
      ? packagingMaterialFields
      : batchType === 'packaging_material'
        ? productFields
        : [];

  const merged = {
    ...(batchType !== undefined ? { batchType } : {}),
    ...rest,
  };

  return cleanObject(merged as T, excludedFields);
};
