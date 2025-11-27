import type { ReactNode } from 'react';
import type {
  DropdownRenderParams,
  ProductDropdownRenderArgs,
  SkuCodeBaseDropdownRenderArgs,
} from '@features/sku/types/skuFieldTypes';
import ProductDropdown from '@features/lookup/components/ProductDropdown';
import {
  getProductHelperText,
  getSkuCodeBaseDropdownHelperText,
} from '@features/sku/components/CreateSkuForm/SkuFieldValidators';
import SkuCodeBaseDropdown from '@features/lookup/components/SkuCodeBaseDropdown';
import BaseInput from '@components/common/BaseInput';

/* =====================================================================
 * RENDER: PRODUCT DROPDOWN
 * ===================================================================== */

/**
 * Renderer for the **Product** lookup dropdown.
 *
 * - Syncs selected product back into RHF via `form.setValue()`
 * - Updates dropdown UI label state
 * - Calls optional backend sync helper
 *
 * Used in both:
 * - Single-SKU Create form
 */
export const renderProductDropdown = (
  args: ProductDropdownRenderArgs
) => {
  const { value, onChange, required, ctx } = args;
  if (!onChange) return null;
  
  return (
    <ProductDropdown
      value={value ?? ""}
      onChange={(id) => {
        onChange(id);
        
        // Sync into form
        ctx.form?.setValue("product_id", id, {
          shouldValidate: true,
          shouldDirty: true,
        });
        
        // Update visible label
        const match = ctx.product.options.find((opt) => opt.value === id);
        if (match) {
          ctx.productDropdown.setDropdownState((prev: any) => ({
            ...prev,
            inputValue: match.label,
          }));
        }
        
        // Optional “backend state sync”
        ctx.syncProductDropdownLabel?.(id);
      }}
      options={ctx.product.options}
      fetchParams={ctx.productDropdown.fetchParams}
      setFetchParams={ctx.productDropdown.setFetchParams}
      onRefresh={(params) => ctx.product.fetch(params)}
      inputValue={ctx.productDropdown.dropdownState.inputValue}
      loading={ctx.product.loading}
      error={ctx.product.error}
      paginationMeta={ctx.product.meta}
      onInputChange={(_e, newValue, reason) => {
        if (reason !== "input") return;
        
        ctx.productDropdown.setDropdownState((prev: any) => ({
          ...prev,
          inputValue: newValue,
          fetchParams: {
            ...prev.fetchParams,
            keyword: newValue,
            offset: 0,
          },
        }));
        
        ctx.handleProductSearch(newValue);
      }}
      helperText={getProductHelperText(value, !!required, ctx.product.options)}
    />
  );
};

/* =====================================================================
 * RENDER: SKU CODE BASE DROPDOWN
 * ===================================================================== */

/**
 * Renderer for the **SKU Code Base** dropdown.
 *
 * Behaviors:
 * - Parses the selected base to extract brand_code + category_code
 * - Supports BOTH single-SKU mode and bulk-row mode
 * - Updates RHF fields (single mode)
 * - Updates row state (bulk mode)
 * - Syncs dropdown label
 */
export const renderSkuCodeBaseDropdown = (args: SkuCodeBaseDropdownRenderArgs) => {
  const { value, onChange, required, ctx, getRowValues, setRowValues } = args;
  if (!onChange) return null;
  
  const handleSelect = (selectedId: string) => {
    onChange(selectedId);
    
    const match = ctx.skuCodeBase.options.find(
      (opt: any) => opt.value === selectedId
    );
    
    if (match?.label) {
      const { brand_code, category_code } =
        ctx.parseSkuCodeBaseLabel(match.label);
      
      // Single-SKU mode: use RHF form
      if (!getRowValues && !setRowValues) {
        ctx.form?.setValue("brand_code", brand_code, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        
        ctx.form?.setValue("category_code", category_code, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
      
      // Bulk mode: row-state sync
      if (getRowValues && setRowValues) {
        const current = getRowValues() ?? {};
        setRowValues({ ...current, brand_code, category_code });
      }
      
      // Update dropdown visible text
      ctx.skuCodeBaseDropdown.setDropdownState((prev: any) => ({
        ...prev,
        inputValue: match.label,
      }));
    }
  };
  
  return (
    <SkuCodeBaseDropdown
      value={value ?? ""}
      onChange={handleSelect}
      options={ctx.skuCodeBase.options}
      fetchParams={ctx.skuCodeBaseDropdown.fetchParams}
      setFetchParams={ctx.skuCodeBaseDropdown.setFetchParams}
      onRefresh={(params) => ctx.skuCodeBase.fetch(params)}
      inputValue={ctx.skuCodeBaseDropdown.dropdownState.inputValue}
      loading={ctx.skuCodeBase.loading}
      error={ctx.skuCodeBase.error}
      paginationMeta={ctx.skuCodeBase.meta}
      onInputChange={(_e, newValue, reason) => {
        if (reason !== "input") return;
        
        ctx.skuCodeBaseDropdown.setDropdownState((prev: any) => ({
          ...prev,
          inputValue: newValue,
          fetchParams: {
            ...prev.fetchParams,
            keyword: newValue,
            offset: 0,
          },
        }));
        
        ctx.handleSkuCodeBaseSearch(newValue);
      }}
      helperText={getSkuCodeBaseDropdownHelperText(
        value,
        !!required,
        ctx.skuCodeBase.options
      )}
    />
  );
};

/* =====================================================================
 * GENERIC DROPDOWN FIELD RENDERER
 * ===================================================================== */

/**
 * Shared generic dropdown renderer.
 *
 * Works for any lookup-based dropdown that:
 * - Uses `value`, `onChange`, and `label`
 * - Has an optional helper-text function
 * - Uses a custom dropdown component
 */
export const renderDropdownField = <T,>({
                                          label,
                                          value,
                                          required,
                                          onChange,
                                          options,
                                          helperTextFn,
                                          component: Component,
                                          extraProps = {},
                                        }: DropdownRenderParams<T>) => {
  if (!onChange) return null;
  
  const helperText = helperTextFn
    ? helperTextFn(value, required, options ?? [])
    : undefined;
  
  return (
    <Component
      label={label}
      value={value}
      onChange={onChange}
      helperText={helperText}
      {...extraProps}
    />
  );
};

/* =====================================================================
 * BASE INPUT FIELD (TEXT INPUT)
 * ===================================================================== */

/**
 * Generic text input renderer.
 *
 * Supports:
 * - Optional input transformer (e.g., uppercase)
 * - Optional helper text generator
 */
export const renderBaseInputField = ({
                                       label,
                                       value,
                                       required,
                                       onChange,
                                       helperTextFn,
                                       transform,
                                     }: {
  label: string;
  value: any;
  required: boolean;
  onChange?: (v: string) => void;
  helperTextFn?: (value: string, required: boolean) => ReactNode;
  transform?: (v: string) => string;
}) => {
  return (
    <BaseInput
      label={label}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        const output = transform ? transform(raw) : raw;
        onChange?.(output);
      }}
      helperText={
        helperTextFn ? helperTextFn(value ?? "", required) : undefined
      }
    />
  );
};
