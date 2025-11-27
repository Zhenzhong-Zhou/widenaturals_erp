import type { UseFormReturn } from 'react-hook-form';
import type { BulkSkuRow, CreateSkuForm } from '@features/sku/types/skuFormTypes';
import type { CreateSkuInput } from '@features/sku/state';

/**
 * Build a backend-ready `CreateSkuInput` payload from the single-SKU
 * React Hook Form state.
 *
 * ### Why this function is needed
 * RHF will sometimes omit non-rendered fields (e.g., brand_code,
 * category_code when they are set programmatically). To ensure correctness:
 *
 * - We first read the value directly from RHF via `form.getValues()`
 * - If RHF did not register the field, fall back to `formData`
 * - If both are missing, default to an empty string (backend validation will catch)
 *
 * This guarantees that `brand_code` and `category_code` always have
 * up-to-date values, even if the fields were not registered or visible.
 *
 * ### Also converts:
 * - Numeric input strings (`"120"`) → numbers (`120`)
 * - Empty strings / null → `null` for numeric fields
 *
 * @param formData - The raw RHF form values supplied by handleSubmit()
 * @param form - The full RHF form instance (for reading current field values)
 *
 * @returns A fully normalized `CreateSkuInput` ready for API submission.
 */
export const buildSingleSkuPayload = (
  formData: CreateSkuForm,
  form: UseFormReturn<CreateSkuForm>
): CreateSkuInput => {
  const brandFromForm = form.getValues("brand_code");
  const categoryFromForm = form.getValues("category_code");
  
  const brand_code = brandFromForm || formData.brand_code || "";
  const category_code = categoryFromForm || formData.category_code || "";
  
  return {
    product_id: formData.product_id ?? "",
    brand_code,
    category_code,
    variant_code: formData.variant_code ?? "",
    region_code: formData.region_code ?? "",
    
    barcode: formData.barcode ?? "",
    language: formData.language ?? "",
    market_region: formData.market_region ?? "",
    size_label: formData.size_label ?? "",
    description: formData.description ?? "",
    
    length_cm: formData.length_cm ? Number(formData.length_cm) : null,
    width_cm: formData.width_cm ? Number(formData.width_cm) : null,
    height_cm: formData.height_cm ? Number(formData.height_cm) : null,
    weight_g: formData.weight_g ? Number(formData.weight_g) : null,
  };
};

/**
 * Build a backend-ready `CreateSkuInput` payload from a single row in the
 * bulk SKU creation table.
 *
 * ### Why this function is separate
 * Bulk rows are not controlled by RHF; each row maintains its own state.
 * Some fields may come from:
 * - User-typed input
 * - CSV imports
 * - Auto-filled SKU Code Base mappings
 *
 * Therefore, the payload builder:
 * - Normalizes string/number fields
 * - Ensures missing fields default to empty string
 * - Converts numeric inputs into numbers (or null if blank)
 *
 * @param row - A single row's state from the MultiItemForm table.
 *
 * @returns A normalized `CreateSkuInput` payload for backend submission.
 */
export const buildBulkSkuPayload = (
  row: BulkSkuRow
): CreateSkuInput => ({
  product_id: row.product_id ?? "",
  brand_code: row.brand_code ?? "",
  category_code: row.category_code ?? "",
  variant_code: row.variant_code ?? "",
  region_code: row.region_code ?? "",
  
  barcode: row.barcode ?? "",
  language: row.language ?? "",
  market_region: row.market_region ?? "",
  size_label: row.size_label ?? "",
  description: row.description ?? "",
  
  length_cm: row.length_cm ? Number(row.length_cm) : null,
  width_cm: row.width_cm ? Number(row.width_cm) : null,
  height_cm: row.height_cm ? Number(row.height_cm) : null,
  weight_g: row.weight_g ? Number(row.weight_g) : null,
});
