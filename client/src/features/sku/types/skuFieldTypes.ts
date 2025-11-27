import type { ComponentType, JSX, ReactNode } from 'react';
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
 * This object centralizes all dependencies needed during rendering:
 * - React Hook Form instance (`form`) for value updates
 * - Lookup bundles for Product and SKU Code Base dropdowns
 * - Pagination state + search handlers for dropdowns
 * - Feature flags (whether field editing should be manual/forced)
 * - Helper utilities such as label parsers
 *
 * This allows all render functions (single + bulk mode) to behave
 * consistently and avoids prop drilling or repeated imports.
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
 * - `singleRender`/`bulkRender` override default rendering
 * - `defaultValue` seeds RHF or bulk-row initial values
 */
export interface BaseSkuField {
  /** Field key, mapped to RHF field name or bulk row property */
  id: string;
  
  /** Visible label */
  label: string;
  
  /** Input type (text/number/textarea/dropdown/custom) */
  type: BaseFieldType;
  
  /** Whether this field is mandatory */
  required?: boolean;
  
  /** Minimum numeric value (for number inputs) */
  min?: number;
  
  /** Number of rows for textarea fields */
  rows?: number;
  
  /** Initial value for this field */
  defaultValue?: any;
  
  /** Custom renderer for single SKU mode */
  singleRender?: SingleRenderer;
  
  /** Custom renderer for bulk SKU mode */
  bulkRender?: BulkRenderer;
}

/**
 * Supported base field types before rendering translation.
 */
export type BaseFieldType =
  | "text"
  | "textarea"
  | "number"
  | "dropdown"
  | "custom";

/* ========================================================================
 * PRODUCT DROPDOWN RENDER PARAMETERS
 * ===================================================================== */

/**
 * Parameters passed to the Product dropdown renderer.
 *
 * Supports:
 * - Standard RHF single selection mode
 * - Backend label synchronization
 */
export interface ProductDropdownRenderArgs {
  /** Current field value (product_id) */
  value: any;
  
  /** Change handler (undefined when field is read-only) */
  onChange?: (id: string) => void;
  
  /** Whether field is required */
  required?: boolean;
  
  /** Shared SKU field context */
  ctx: SkuFieldContext;
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

/* ========================================================================
 * GENERIC DROPDOWN RENDER PARAMS
 * ===================================================================== */

/**
 * Generic dropdown generator parameters.
 *
 * Used by `renderDropdownField` to avoid repeated boilerplate when rendering:
 * - Product dropdown
 * - SKU Code Base dropdown
 * - Any future lookup-based dropdown (brand/category, region, etc.)
 *
 * Makes dropdown rendering declarative and reusable.
 */
export interface DropdownRenderParams<T> {
  /** Visible field label */
  label: string;
  
  /** Field value */
  value: T;
  
  /** Change handler (RHF or bulk row updater) */
  onChange?: (v: T) => void;
  
  /** Whether field should be validated as required */
  required: boolean;
  
  /** List of selectable options */
  options?: Array<{ value: T; label: string }>;
  
  /** HelperText generator */
  helperTextFn?: (
    value: T,
    required: boolean,
    options?: Array<{ value: T; label: string }>
  ) => ReactNode;
  
  /** Dropdown component type (ProductDropdown, SkuCodeBaseDropdown, etc.) */
  component: ComponentType<{
    value: T;
    onChange: (v: T) => void;
    helperText?: ReactNode;
    label?: string;
  }>;
  
  /** Optional props passed through to the dropdown */
  extraProps?: Record<string, any>;
}
