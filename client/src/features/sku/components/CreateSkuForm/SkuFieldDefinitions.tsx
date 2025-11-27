import type {
  BaseSkuField,
  SkuFieldContext
} from '@features/sku/types/skuFieldTypes';
import {
  CountryRegionCodeDropdown,
  MarketRegionDropdown,
  VariantCodeDropdown,
} from '@features/sku/components/CreateSkuForm';
import {
  detectBarcodeRule,
  getBarcodeHelperText,
  getBrandCategoryHelperText,
  getLanguageHelperText,
  getMarketRegionHelperText,
  getRegionCodeHelperText,
  getVariantCodeHelperText,
} from '@features/sku/components/CreateSkuForm';
import {
  renderBaseInputField,
  renderDropdownField,
  renderProductDropdown,
  renderSkuCodeBaseDropdown,
} from '@features/sku/components/CreateSkuForm/SkuFieldRenderer';
import { buildRequiredHelper } from '@components/common/PatternHelper';

/**
 * Build the full list of SKU form fields with dynamic renderer logic.
 *
 * This function:
 * - Applies feature flags (manual vs dropdown fields)
 * - Defines all SKU creation fields for both Single-SKU and Bulk-SKU modes
 * - Produces a unified BaseSkuField[] structure consumed by CustomForm / MultiItemForm
 *
 * The returned array dynamically switches renderers based on:
 * - ctx.allowManualBrandCategory
 * - ctx.allowManualVariantCode
 * - ctx.allowManualRegionCode
 * - ctx.allowManualMarketRegion
 *
 * @param {SkuFieldContext} ctx - Shared rendering and lookup context.
 * @returns {BaseSkuField[]} Full list of field definitions for the SKU form.
 */
export const buildSkuFields = (ctx: SkuFieldContext): BaseSkuField[] => {
  const {
    allowManualBrandCategory,
    allowManualVariantCode,
    allowManualRegionCode,
    allowManualMarketRegion,
  } = ctx;
  
  return [
    // ============================================================
    // PRODUCT (lookup dropdown)
    // ============================================================
    {
      id: "product_id",
      label: "Product",
      type: "custom",
      required: true,
      singleRender: (params) =>
        renderProductDropdown({
          value: params.value ?? "",
          onChange: params.onChange,
          required: params.required,
          ctx: params.ctx,
        }),
      bulkRender: (params) => renderProductDropdown({ ...params, ctx }),
    },
    
    // ============================================================
    // BRAND + CATEGORY
    // Either manual text input OR SKU Code Base dropdown
    // ============================================================
    ...(allowManualBrandCategory
        ? (
          [
            // BRAND
            {
              id: "brand_code",
              label: "Brand Code",
              type: "custom",
              required: true,
              singleRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Brand Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getBrandCategoryHelperText,
                  transform: (v) => v.toUpperCase(), // normalization
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Brand Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getBrandCategoryHelperText,
                  transform: (v) => v.toUpperCase(),
                }),
            },
            // CATEGORY
            {
              id: "category_code",
              label: "Category Code",
              type: "custom",
              required: true,
              singleRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Category Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getBrandCategoryHelperText,
                  transform: (v) => v.toUpperCase(),
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Category Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getBrandCategoryHelperText,
                  transform: (v) => v.toUpperCase(),
                }),
            },
          ] satisfies BaseSkuField[]
        )
        : (
          [
            {
              id: "sku_code_base_id",
              label: "Brand / Category",
              type: "custom",
              required: true,
              singleRender: (params) =>
                renderSkuCodeBaseDropdown({
                  value: params.value ?? "",
                  onChange: params.onChange,
                  required: params.required,
                  ctx,
                }),
              bulkRender: (params) => renderSkuCodeBaseDropdown({ ...params, ctx }),
            },
          ] satisfies BaseSkuField[]
        )
    ),
    
    // ============================================================
    // VARIANT CODE
    // Manual entry OR preset dropdown
    // ============================================================
    ...(allowManualVariantCode
        ? (
          [
            {
              id: "variant_code",
              label: "Variant Code",
              type: "custom",
              required: true,
              singleRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Variant Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getVariantCodeHelperText,
                  transform: (v) => v.toUpperCase(),
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Variant Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getVariantCodeHelperText,
                  transform: (v) => v.toUpperCase(),
                }),
            },
          ] satisfies BaseSkuField[]
        )
        : (
          [
            {
              id: "variant_code",
              label: "Variant Code",
              type: "custom",
              required: true,
              singleRender: ({ value, onChange, required }) =>
                renderDropdownField({
                  label: "Variant Code",
                  value: value ?? "",
                  required: !!required,
                  onChange,
                  component: VariantCodeDropdown,
                  helperTextFn: getVariantCodeHelperText,
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderDropdownField({
                  label: "Variant Code",
                  value: value ?? "",
                  required: !!required,
                  onChange,
                  component: VariantCodeDropdown,
                  helperTextFn: getVariantCodeHelperText,
                }),
            },
          ] satisfies BaseSkuField[]
        )
    ),
    
    // ============================================================
    // REGION CODE
    // Manual text OR preset dropdown
    // ============================================================
    ...(allowManualRegionCode
        ? (
          [
            {
              id: "region_code",
              label: "Region Code",
              type: "custom",
              required: true,
              singleRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Region Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getRegionCodeHelperText,
                  transform: (v) => v.toUpperCase(),
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Region Code",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getRegionCodeHelperText,
                  transform: (v) => v.toUpperCase(),
                }),
            },
          ] satisfies BaseSkuField[]
        )
        : (
          [
            {
              id: "region_code",
              label: "Region Code",
              type: "custom",
              required: true,
              singleRender: ({ value, onChange, required }) =>
                renderDropdownField({
                  label: "Region Code",
                  value: value ?? "",
                  required: !!required,
                  onChange,
                  component: CountryRegionCodeDropdown,
                  helperTextFn: getRegionCodeHelperText,
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderDropdownField({
                  label: "Region Code",
                  value: value ?? "",
                  required: !!required,
                  onChange,
                  component: CountryRegionCodeDropdown,
                  helperTextFn: getRegionCodeHelperText,
                }),
            },
          ] satisfies BaseSkuField[]
        )
    ),
    
    // ============================================================
    // MARKET REGION
    // Manual entry OR dropdown (default Canada)
    // ============================================================
    ...(allowManualMarketRegion
        ? (
          [
            {
              id: "market_region",
              label: "Market Region",
              type: "custom",
              required: true,
              singleRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Market Region",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getMarketRegionHelperText,
                  transform: (v) =>
                    v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderBaseInputField({
                  label: "Market Region",
                  value,
                  required: !!required,
                  onChange,
                  helperTextFn: getMarketRegionHelperText,
                  transform: (v) =>
                    v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
                }),
            },
          ] satisfies BaseSkuField[]
        )
        : (
          [
            {
              id: "market_region",
              label: "Market Region",
              type: "custom",
              required: true,
              defaultValue: "Canada",
              singleRender: ({ value, onChange, required }) =>
                renderDropdownField({
                  label: "Market Region",
                  value: value ?? "Canada",
                  required: !!required,
                  onChange,
                  component: MarketRegionDropdown,
                  helperTextFn: getMarketRegionHelperText,
                }),
              bulkRender: ({ value, onChange, required }) =>
                renderDropdownField({
                  label: "Market Region",
                  value: value ?? "Canada",
                  required: !!required,
                  onChange,
                  component: MarketRegionDropdown,
                  helperTextFn: getMarketRegionHelperText,
                }),
            },
          ] satisfies BaseSkuField[]
        )
    ),
    
    // ============================================================
    // SIMPLE TEXT INPUTS
    // ============================================================
    {
      id: "barcode",
      label: "Barcode",
      type: "custom",
      required: true,
      singleRender: ({ value, onChange, required }) =>
        renderBaseInputField({
          label: "Barcode",
          value,
          required: !!required,
          onChange,
          helperTextFn: (v, isReq) =>
            getBarcodeHelperText(v ?? "", isReq, detectBarcodeRule(v ?? "")),
        }),
      bulkRender: ({ value, onChange, required }) =>
        renderBaseInputField({
          label: "Barcode",
          value,
          required: !!required,
          onChange,
          helperTextFn: (v, isReq) =>
            getBarcodeHelperText(v ?? "", isReq, detectBarcodeRule(v ?? "")),
        }),
    },
    {
      id: "language",
      label: "Language",
      type: "custom",
      required: true,
      defaultValue: "en-fr",
      singleRender: ({ value, onChange, required }) =>
        renderBaseInputField({
          label: "Language",
          value: value ?? "en-fr",
          onChange,
          required: !!required,
          helperTextFn: getLanguageHelperText,
        }),
      bulkRender: ({ value, onChange, required }) =>
        renderBaseInputField({
          label: "Language",
          value: value ?? "en-fr",
          onChange,
          required: !!required,
          helperTextFn: getLanguageHelperText,
        }),
    },
    {
      id: "size_label",
      label: "Size Label",
      type: "custom",
      required: true,
      singleRender: ({ value, onChange, required }) =>
        renderBaseInputField({
          label: "Size Label",
          value: value ?? "",
          onChange,
          required: !!required,
          helperTextFn: buildRequiredHelper,
        }),
      bulkRender: ({ value, onChange, required }) =>
        renderBaseInputField({
          label: "Size Label",
          value: value ?? "",
          onChange,
          required: !!required,
          helperTextFn: buildRequiredHelper,
        }),
    },
    
    // ============================================================
    // DIMENSIONS (numeric)
    // ============================================================
    { id: "length_cm", label: "Length (cm)", type: "number", required: false },
    { id: "width_cm", label: "Width (cm)", type: "number", required: false },
    { id: "height_cm", label: "Height (cm)", type: "number", required: false },
    { id: "weight_g", label: "Weight (g)", type: "number", required: false },
    
    // ============================================================
    // DESCRIPTION (textarea)
    // ============================================================
    {
      id: "description",
      label: "Description",
      type: "textarea",
      required: false,
      rows: 3,
    },
  ];
};
