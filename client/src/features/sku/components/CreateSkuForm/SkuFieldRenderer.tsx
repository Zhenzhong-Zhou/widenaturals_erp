import type {
  ProductDropdownRenderArgs,
  SkuCodeBaseDropdownRenderArgs,
} from '@features/sku/types/skuFieldTypes';
import ProductDropdown from '@features/lookup/components/ProductDropdown';
import {
  getProductHelperText,
  getSkuCodeBaseDropdownHelperText,
} from '@features/sku/components/CreateSkuForm/SkuFieldValidators';
import SkuCodeBaseDropdown from '@features/lookup/components/SkuCodeBaseDropdown';

/* =====================================================================
 * RENDER: PRODUCT DROPDOWN
 * ===================================================================== */

/**
 * Renderer for the **Product** lookup dropdown.
 *
 * Behaviors:
 * - Single mode:
 *   - Syncs selected product back into RHF via `form.setValue()`
 *   - Updates global dropdown UI label state via `ctx.productDropdown`
 *   - Calls optional backend sync helper
 *
 * - Bulk mode:
 *   - Maintains row-level dropdown input state (isolated per row)
 *   - Does NOT update global ctx state
 *   - Stores the visible label in `__productInput` inside the row
 *
 * Used in:
 * - Single-SKU Create form
 * - Multi-item (bulk) SKU Create form
 */
export const renderProductDropdown = (
  args: ProductDropdownRenderArgs
) => {
  const {
    value,
    onChange,
    required,
    ctx,
    getRowValues,
    setRowValues,
  } = args;
  
  if (!onChange) return null;
  
  const isBulk = !!getRowValues;
  const row = isBulk ? getRowValues() ?? {} : null;
  
  const inputValue = isBulk
    ? row.__productInput ?? ""
    : ctx.productDropdown.dropdownState.inputValue;
  
  return (
    <ProductDropdown
      value={value ?? ""}
      onChange={(id) => {
        onChange(id);
        
        const match = ctx.product.options.find((opt) => opt.value === id);
        
        if (isBulk && setRowValues) {
          // bulk row → update row only
          setRowValues({
            ...row,
            __productInput: match?.label ?? "",
          });
        } else {
          // single mode → sync form + global label
          ctx.form?.setValue("product_id", id, {
            shouldValidate: true,
            shouldDirty: true,
          });
          
          if (match) {
            ctx.productDropdown.setDropdownState((prev: any) => ({
              ...prev,
              inputValue: match.label,
            }));
          }
        }
        
        // backend optional sync
        ctx.syncProductDropdownLabel?.(id);
      }}
      options={ctx.product.options}
      fetchParams={ctx.productDropdown.fetchParams}
      setFetchParams={ctx.productDropdown.setFetchParams}
      onRefresh={(params) => ctx.product.fetch(params)}
      inputValue={inputValue}
      loading={ctx.product.loading}
      error={ctx.product.error}
      paginationMeta={ctx.product.meta}
      onInputChange={(_e, newValue, reason) => {
        if (reason !== "input") return;
        
        if (isBulk && setRowValues) {
          // bulk mode → local row state only
          setRowValues({
            ...row,
            __productInput: newValue,
          });
        } else {
          // single mode → global ctx
          ctx.productDropdown.setDropdownState((prev: any) => ({
            ...prev,
            inputValue: newValue,
            fetchParams: {
              ...prev.fetchParams,
              keyword: newValue,
              offset: 0,
            },
          }));
        }
        
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
 * - Extracts brand_code and category_code from the selected base
 *
 * - Single-SKU mode:
 *   - Updates RHF form fields (`brand_code`, `category_code`)
 *   - Updates global dropdown UI label state
 *
 * - Bulk mode:
 *   - Uses row-level dropdown input state (per-row isolation)
 *   - Stores visible input in `__skuCodeBaseInput`
 *   - Updates brand/category on the row only (no global state updates)
 *
 * Also:
 * - Supports async search and pagination via ctx
 */
export const renderSkuCodeBaseDropdown = (args: SkuCodeBaseDropdownRenderArgs) => {
  const { value, onChange, required, ctx, getRowValues, setRowValues } = args;
  if (!onChange) return null;
  
  const isBulk = !!getRowValues;
  const row = isBulk ? getRowValues() ?? {} : null;
  
  // Row-specific inputValue fallback
  const inputValue = isBulk
    ? row.__skuCodeBaseInput ?? ""
    : ctx.skuCodeBaseDropdown.dropdownState.inputValue;
  
  const handleSelect = (selectedId: string) => {
    onChange(selectedId);
    
    const match = ctx.skuCodeBase.options.find(
      (opt: any) => opt.value === selectedId
    );
    
    if (match?.label) {
      const { brand_code, category_code } =
        ctx.parseSkuCodeBaseLabel(match.label);
      
      // Single-SKU mode: use RHF form
      if (!isBulk) {
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
        
        // global dropdown label
        ctx.skuCodeBaseDropdown.setDropdownState((prev: any) => ({
          ...prev,
          inputValue: match.label,
        }));
      }
      
      // Bulk mode: row-state sync
      if (isBulk && setRowValues) {
        setRowValues({
          ...row,
          __skuCodeBaseInput: match.label, // row-level label
          brand_code,
          category_code,
        });
      }
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
      inputValue={inputValue}
      loading={ctx.skuCodeBase.loading}
      error={ctx.skuCodeBase.error}
      paginationMeta={ctx.skuCodeBase.meta}
      onInputChange={(_e, newValue, reason) => {
        if (reason !== "input") return;
        
        if (isBulk && setRowValues) {
          // Safe bulk-only edit
          setRowValues({
            ...row,
            __skuCodeBaseInput: newValue,
          });
        } else {
          ctx.skuCodeBaseDropdown.setDropdownState((prev: any) => ({
            ...prev,
            inputValue: newValue,
            fetchParams: {
              ...prev.fetchParams,
              keyword: newValue,
              offset: 0,
            },
          }));
        }
        
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
