import {
  FlattenedProductDetail,
  ProductUpdateRequest
} from '@features/product/state';

/**
 * Builds initial form values for the "Update Product Info" dialog.
 *
 * This function extracts only the editable fields from a FlattenedProductDetail
 * object and normalizes null or undefined values into empty strings so they
 * can be safely used as controlled values in React forms.
 *
 * @param product - A flattened product detail object from the product detail API.
 * @returns A ProductUpdateRequest object containing only editable fields.
 *
 * @example
 * const initial = buildInitialInfoValues(product);
 * // {
 * //   name: "Omega-3",
 * //   series: "Heart Health",
 * //   brand: "WN",
 * //   category: "Supplements",
 * //   description: "Supports cardiovascular health"
 * // }
 */
export const buildInitialInfoValues = (
  product: FlattenedProductDetail
): ProductUpdateRequest => ({
  name: product.name ?? "",
  series: product.series ?? "",
  brand: product.brand ?? "",
  category: product.category ?? "",
  description: product.description ?? "",
});


/**
 * Computes the delta (difference) between the initial values and the updated
 * form values for a product info update request.
 *
 * Only fields whose values differ from the initial values are included in the
 * returned `delta` object. This prevents sending unchanged fields to the backend,
 * reduces unnecessary database writes, and improves audit log accuracy.
 *
 * @param initial - The initial values loaded into the form.
 * @param current - The user's updated form values.
 * @returns A partial ProductUpdateRequest containing only changed fields.
 *
 * @example
 * const initial = { name: "Protein", description: "" };
 * const current = { name: "Protein", description: "High quality whey" };
 *
 * const delta = buildProductUpdateDelta(initial, current);
 * // { description: "High quality whey" }
 *
 * @remarks
 * - Empty objects `{}` mean no changes.
 * - Comparison is a shallow strict equality check.
 * - The function is safe for optional fields.
 */
export const buildProductUpdateDelta = (
  initial: ProductUpdateRequest,
  current: ProductUpdateRequest
): ProductUpdateRequest => {
  const delta: ProductUpdateRequest = {};
  
  for (const key of Object.keys(current) as (keyof ProductUpdateRequest)[]) {
    if (current[key] !== initial[key]) {
      delta[key] = current[key];
    }
  }
  
  return delta;
};
