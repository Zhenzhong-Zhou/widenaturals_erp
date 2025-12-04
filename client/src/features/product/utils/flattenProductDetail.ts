import {
  FlattenedProductDetail,
  ProductResponse
} from '@features/product/state';

/**
 * Flattens a `ProductResponse` object into a UI-friendly structure by
 * extracting nested `status` and `audit` fields into top-level properties.
 *
 * This utility normalizes backend product detail data for display components
 * such as `<DetailsSection />`, tables, and summary cards.
 *
 * Behavior:
 * - All core product fields (`id`, `name`, `brand`, etc.) remain unchanged.
 * - The nested `status` object is flattened into:
 *     - `statusId`
 *     - `statusName`
 *     - `statusDate`
 * - The nested `audit` object is flattened into:
 *     - `createdAt`, `createdById`, `createdByName`
 *     - `updatedAt`, `updatedById`, `updatedByName`
 * - Missing or undefined values are normalized to `null` for consistency.
 *
 * @param product - The full `ProductResponse` object from the API.
 * @returns A `FlattenedProductDetail` object, or `null` if no product is supplied.
 *
 * @example
 * const flat = flattenProductDetail(apiResponse.data);
 * console.log(flat.statusName); // "active"
 */
export const flattenProductDetail = (
  product: ProductResponse
): FlattenedProductDetail | null => {
  if (!product) return null;
  
  const { status, audit, ...rest } = product;
  
  return {
    ...rest,
    
    // Status
    statusId: status?.id ?? null,
    statusName: status?.name ?? null,
    statusDate: status?.date ?? null,
    
    // Audit
    createdAt: audit?.createdAt ?? null,
    createdById: audit?.createdBy?.id ?? null,
    createdByName: audit?.createdBy?.name ?? null,
    
    updatedAt: audit?.updatedAt ?? null,
    updatedById: audit?.updatedBy?.id ?? null,
    updatedByName: audit?.updatedBy?.name ?? null,
  };
};
