import type { JSX } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type {
  LookupBundle,
  ProductLookupParams,
  SkuCodeBaseLookupParams,
} from '@features/lookup/state';
import type { UsePaginatedDropdownReturn } from '@utils/lookupHelpers';
import type { CustomRenderParams } from '@components/common/CustomForm';
import type { RowAwareComponentProps } from '@components/common/MultiItemForm';

/* ========================================================================
 * SKU FIELD CONTEXT
 * ===================================================================== */

/**
 * Shared rendering context injected into every SKU field renderer.
 *
 * This object centralizes all shared dependencies needed during field rendering,
 * and allows both "single" and "bulk" SKU creation flows to use the same abstract
 * field definitions while differing in UI behavior.
 *
 * This context provides:
 *
 * 1. **Form Integration (Single Mode Only)**
 *    - The React Hook Form instance (`form`) is available only in single-SKU mode.
 *    - Single renderers use `form.setValue()` to sync dropdown selections and
 *      autofill dependent fields (e.g., brand/category codes).
 *
 * 2. **Lookup Data + Async Pagination**
 *    - `product` and `skuCodeBase` contain lookup results, pagination metadata,
 *      loading/error states, and fetch functions.
 *    - `productDropdown` and `skuCodeBaseDropdown` carry global dropdown UI state
 *      (inputValue, pagination, keyword) for **single-SKU mode only**.
 *
 * 3. **Search Handlers**
 *    - `handleProductSearch()` and `handleSkuCodeBaseSearch()` trigger lookup
 *      filtering as the user types in dropdown inputs.
 *
 * 4. **Label Parsing + Autofill Utilities**
 *    - `parseSkuCodeBaseLabel()` translates a label (e.g., "PG-HN") into structured
 *      brand/category codes that can be written into form fields or bulk-row state.
 *
 * 5. **Feature Flags**
 *    - Control whether certain fields (brand/category, variant, region, market region)
 *      are editable manually or via predefined dropdown selections.
 *
 * 6. **Single vs Bulk Rendering Behavior**
 *    - **Single mode** uses the global dropdown UI state inside `ctx.productDropdown`
 *      / `ctx.skuCodeBaseDropdown`.
 *    - **Bulk mode** does NOT use global dropdown state. Instead, renderers maintain
 *      per-row `inputValue` inside the row state (e.g., `__productInput`,
 *      `__skuCodeBaseInput`) to avoid cross-row interference.
 *
 * This context avoids prop-drilling, eliminates duplicate imports, and provides a
 * unified rendering contract for all SKU field renderers.
 */
export interface SkuFieldContext {
  /** UI permissions: allow manual typing of brand/category codes */
  allowManualBrandCategory: boolean;

  /** UI permissions: allow user to manually type variant code */
  allowManualVariantCode: boolean;

  /** UI permissions: allow user to manually edit region code */
  allowManualRegionCode: boolean;

  /** UI permissions: allow editing of market region */
  allowManualMarketRegion: boolean;

  /** React Hook Form instance (undefined in bulk mode) */
  form?: UseFormReturn<any>;

  /* --------------------------------------------------------------------
   * PRODUCT LOOKUP
   * ------------------------------------------------------------------ */

  /** Product lookup bundle (data, loading, error, pagination) */
  product: LookupBundle<ProductLookupParams>;

  /** Pagination & state controller for Product dropdown */
  productDropdown: UsePaginatedDropdownReturn<ProductLookupParams>;

  /** Handler for Product lookup search text */
  handleProductSearch: (keyword: string) => void;

  /** Optional additional props for Product dropdown customization */
  productProps?: Record<string, any>;

  /* --------------------------------------------------------------------
   * SKU CODE BASE LOOKUP
   * ------------------------------------------------------------------ */

  /** SKU Code Base lookup bundle (brand/category code source) */
  skuCodeBase: LookupBundle<SkuCodeBaseLookupParams>;

  /** Pagination & state controller for SKU Code Base dropdown */
  skuCodeBaseDropdown: UsePaginatedDropdownReturn<SkuCodeBaseLookupParams>;

  /** Handler for SKU Code Base search input */
  handleSkuCodeBaseSearch: (keyword: string) => void;

  /**
   * Parse a dropdown label into structured brand/category components.
   * Example:
   *   "PG-HN (PhytoGenious / Hormone)" → { brand_code: "PG", category_code: "HN" }
   */
  parseSkuCodeBaseLabel: (label: string) => {
    brand_code: string;
    category_code: string;
  };

  /** Optional handler to sync Product dropdown label from backend */
  syncProductDropdownLabel?: (id: string) => void;

  /** Optional handler to sync SKU Code Base label after change */
  syncSkuCodeBaseLabel?: (id: string) => void;

  /**
   * Optional layout grid overrides for this field.
   * Matches the MUI Grid breakpoint structure (xs / sm / md / lg).
   */
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

/* ========================================================================
 * RENDERER SIGNATURES
 * ===================================================================== */

/**
 * Renderer signature for **single-SKU mode**.
 * Called by CustomForm for each field that defines `.singleRender`.
 *
 * Receives:
 * - CustomRenderParams (value, onChange, RHF helpers)
 * - SkuFieldContext (lookup data, form instance, parsers)
 */
export type SingleRenderer = (
  args: CustomRenderParams & { ctx: SkuFieldContext }
) => JSX.Element | null;

/**
 * Renderer signature for **bulk mode**.
 * Called by MultiItemForm for each dynamic row/field combo.
 *
 * Receives:
 * - RowAwareComponentProps (row state, updater callbacks)
 * - SkuFieldContext (shared lookup + parsing logic)
 */
export type BulkRenderer = (
  args: RowAwareComponentProps & { ctx: SkuFieldContext }
) => JSX.Element | null;

/* ========================================================================
 * BASE FIELD DEFINITION
 * ===================================================================== */

/**
 * Base logical definition of an SKU form field before translation into
 * either React Hook Form config (single mode) or MultiItemForm config (bulk mode).
 *
 * Fields act like an abstract schema:
 * - `type` determines input behavior
 * - `singleRender` / `bulkRender` override default UI rendering
 * - `defaultValue` seeds RHF or bulk-row initial values
 *
 * This structure is consumed by:
 * - buildSingleSkuFields → <CustomForm />
 * - buildBulkSkuFields   → <MultiItemForm />
 */
export interface BaseSkuField {
  /** Field key, mapped to RHF field name or bulk-row property */
  id: string;

  /** Visible label displayed to the user */
  label: string;

  /**
   * Input type describing how the value is edited.
   * Examples: "text", "number", "textarea", "dropdown", "custom"
   */
  type: BaseFieldType;

  /** Whether the field is required for submission */
  required?: boolean;

  /** Minimum allowed numeric value (applies only to number inputs) */
  min?: number;

  /** Height of textarea fields (line count) */
  rows?: number;

  /**
   * Initial value for this field.
   * Used to seed RHF (single mode) or the initial row in MultiItemForm (bulk mode).
   */
  defaultValue?: any;

  /**
   * Custom renderer used in **single-SKU** mode.
   * Overrides the default component, allowing specialized dropdowns or logic.
   */
  singleRender?: SingleRenderer;

  /**
   * Custom renderer used in **bulk-SKU** mode.
   * Receives row-level helpers (getRowValues, setRowValues) and context.
   */
  bulkRender?: BulkRenderer;

  /**
   * Optional logical grouping identifier
   * (used to cluster fields into UI rows/sections within the form layout).
   */
  group?: string;

  /**
   * Optional MUI grid sizing for responsive layout.
   * Each breakpoint defines how many columns the field spans.
   */
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

/**
 * Supported base field types before rendering translation.
 */
export type BaseFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'dropdown'
  | 'custom';

/* ========================================================================
 * PRODUCT DROPDOWN RENDER PARAMETERS
 * ===================================================================== */

/**
 * Arguments passed to the Product dropdown renderer.
 *
 * This structure supports both rendering modes:
 *
 * - **Single-SKU mode**
 *   - Uses global dropdown UI state from `ctx.productDropdown`
 *   - Syncs selection back into the RHF form
 *
 * - **Bulk-SKU mode**
 *   - Uses row-level state via `getRowValues()` / `setRowValues()`
 *   - Does NOT write to global dropdown state to avoid cross-row interference
 *
 * Each renderer receives these arguments automatically from either
 * CustomForm (single mode) or MultiItemForm (bulk mode).
 */
export interface ProductDropdownRenderArgs {
  /** Current field value (typically the selected product_id) */
  value: any;

  /** Change handler (undefined when field is read-only) */
  onChange?: (id: string) => void;

  /** Whether the field must be filled */
  required?: boolean;

  /** Shared SKU field context (lookup bundles, search handlers, RHF form, etc.) */
  ctx: SkuFieldContext;

  /** Returns the bulk row’s current values (defined only in bulk mode) */
  getRowValues?: () => any;

  /** Updates the bulk row’s state (defined only in bulk mode) */
  setRowValues?: (row: any) => void;

  /** Optional layout hint to render the dropdown at full width */
  fullWidth?: boolean;
}

/* ========================================================================
 * SKU CODE BASE DROPDOWN RENDER PARAMETERS
 * ===================================================================== */

/**
 * Parameters passed to the SKU Code Base dropdown renderer.
 *
 * Supports TWO MODES:
 * - Single-SKU mode → updates RHF form fields (brand_code/category_code)
 * - Bulk mode → updates row-level values via `getRowValues` + `setRowValues`
 */
export interface SkuCodeBaseDropdownRenderArgs {
  /** SKU Base selection value */
  value: any;

  /** Change handler hook (null in read-only mode) */
  onChange?: (id: string) => void;

  /** Required flag for validation */
  required?: boolean;

  /** Shared lookup + parsing context */
  ctx: SkuFieldContext;

  /** Get bulk row values (bulk mode only) */
  getRowValues?: () => any;

  /** Set bulk row values (bulk mode only) */
  setRowValues?: (row: any) => void;
}
