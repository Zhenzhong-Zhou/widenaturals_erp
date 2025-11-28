import type { FieldConfig } from '@components/common/CustomForm';
import {
  buildSkuFields,
} from '@features/sku/components/CreateSkuForm';
import type { MultiItemFieldConfig } from '@components/common/MultiItemForm';
import type { SkuFieldContext } from '@features/sku/types/skuFieldTypes';

/**
 * Build field configuration for the **single-SKU creation form**.
 *
 * This function:
 *   - Loads the abstract SKU field definitions (`buildSkuFields`)
 *   - Injects the field-level rendering context (`SkuFieldContext`)
 *   - Converts dropdown-based fields into `type: "custom"` so the UI uses
 *     specialized render functions (SkuCodeBaseDropdown, ProductDropdown, etc.)
 *   - Maps fields that define `singleRender` into a `customRender` function
 *     consumed by <CustomForm />
 *
 * Notes:
 *   - Single-SKU mode uses the shared/global dropdown state in `ctx`
 *     (e.g., ctx.productDropdown, ctx.skuCodeBaseDropdown)
 *
 * @param ctx - Shared SKU field context (lookup bundles, dropdown
 *              state handlers, form instance, parsing utilities, and feature flags).
 *
 * @returns FieldConfig[] - Fully transformed field list for single-SKU mode.
 */
export const buildSingleSkuFields = (ctx: SkuFieldContext): FieldConfig[] => {
  const skuFields = buildSkuFields(ctx);
  
  return skuFields.map((field) => {
    // ---------------------------------------------------
    // CUSTOM RENDER (uses singleRender)
    // ---------------------------------------------------
    if (field.singleRender) {
      return {
        id: field.id,
        label: field.label,
        type: "custom",
        required: field.required,
        defaultValue: field.defaultValue,
        grid: field.grid,
        customRender: (params) =>
          field.singleRender!({
            ...params,
            ctx,
          }),
      } satisfies FieldConfig;
    }
    
    // ---------------------------------------------------
    // NORMAL FIELD (convert dropdown → custom)
    // ---------------------------------------------------
    return {
      id: field.id,
      label: field.label,
      type: field.type === "dropdown" ? "custom" : field.type,
      required: field.required,
      defaultValue: field.defaultValue,
      min: field.min,
      rows: field.rows,
      grid: field.grid ?? { xs: 12, sm: 6 },
    } satisfies FieldConfig;
  });
};

/**
 * Build field configuration for the **bulk-SKU creation table** (MultiItemForm).
 *
 * This function:
 *   - Loads the abstract SKU field definitions from `buildSkuFields`
 *   - Converts each field into a `MultiItemFieldConfig`
 *   - For fields that define `bulkRender`, wraps their custom component
 *     and injects the shared context (`ctx`)
 *   - For basic inputs, preserves the "text" | "number" | "textarea" types
 *
 * Bulk mode behavior:
 *   - Each table row maintains its own independent state
 *   - Dropdown components (Product, SKU Code Base, etc.) use **row-level**
 *     input state (e.g., `__productInput`, `__skuCodeBaseInput`)
 *   - Global dropdown UI state in `ctx` is *not* used in bulk mode
 *   - Selecting an SKU Code Base automatically updates brand/category codes
 *
 * @param ctx - Shared SKU field context (lookup bundles, dropdown handlers,
 *              parser utilities, and UI capability flags).
 *
 * @returns MultiItemFieldConfig[] - Field configuration used by MultiItemForm.
 */
export const buildBulkSkuFields = (ctx: SkuFieldContext): MultiItemFieldConfig[] => {
  const skuFields = buildSkuFields(ctx);
  
  return skuFields.map((field) => {
    // Custom renderer for bulk mode
    if (field.bulkRender) {
      return {
        id: field.id,
        label: field.label,
        type: "custom",
        required: field.required,
        group: field.group,
        grid: field.grid ?? { xs: 12, sm: 6 },
        component: (params) => field.bulkRender!({ ...params, ctx }),
      };
    }
    
    // Fallback: standard input for bulk table cells
    return {
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      min: field.min,
      rows: field.rows,
      group: field.group,
      grid: field.grid ?? { xs: 12, sm: 6 },
    };
  });
};
