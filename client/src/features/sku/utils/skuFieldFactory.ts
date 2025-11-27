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
 *   - Converts all "dropdown" fields into `type: "custom"` so the UI uses
 *     specialized render functions (SkuCodeBaseDropdown, ProductDropdown, etc.)
 *   - Maps fields that define `singleRender` into a `customRender`
 *     implementation for <CustomForm />
 *
 * It returns a list of `FieldConfig` objects that the shared <CustomForm />
 * component can render in the **single item** creation workflow.
 *
 * @param ctx - Shared SKU field context (contains lookup bundles, dropdown
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
 *   - For standard inputs, preserves the "text" | "number" | "textarea" types
 *
 * This allows each row in the bulk creation table to:
 *   - Maintain its own state
 *   - Use the same lookup dropdowns (product, SKU code base)
 *   - Auto-fill brand/category codes when the SKU base changes
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
    };
  });
};
