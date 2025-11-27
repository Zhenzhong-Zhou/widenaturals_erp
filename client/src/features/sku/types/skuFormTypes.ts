import type { CreateSkuInput } from '@features/sku/state';

/* ========================================================================
 * CREATE SKU — FORM STATE (UI Layer)
 * ===================================================================== */

/**
 * React Hook Form state shape for creating a single SKU.
 *
 * This is intentionally **more permissive** than `CreateSkuInput`
 * (the API payload). The UI needs to support:
 * - Null values while dropdowns are unselected
 * - Empty strings while the user is typing
 * - Text input for numeric fields (converted later)
 *
 * The transformation into strict backend-ready payload happens in
 * `buildSingleSkuPayload()`.
 */
export interface CreateSkuForm {
  /** Product to attach this SKU to (nullable until selected) */
  product_id: string | null;
  
  /** SKU Code Base ID (determines brand + category) */
  sku_code_base_id: string | null;
  
  /** Brand code ("PG", "WN", "CJ"), autofilled from SKU Code Base */
  brand_code: string | null;
  
  /** Category code ("MO", "NM", etc.), autofilled from SKU Code Base */
  category_code: string | null;
  
  /** Variant segment (S, M, L, 120, etc.) */
  variant_code: string | null;
  
  /** Region code (CA, CN, US, UN), dropdown or text */
  region_code: string | null;
  
  /** Optional barcode entered by user */
  barcode: string;
  
  /** Language field ("EN", "EN-FR"), free-text or dropdown */
  language: string;
  
  /** Market region ("Canada", "United States") */
  market_region: string;
  
  /** Display size label ("60 Softgels", "120 Capsules") */
  size_label: string;
  
  /** Optional description */
  description: string;
  
  /** Dimensions typed as strings for flexible user input */
  length_cm: string | null;
  width_cm: string | null;
  height_cm: string | null;
  
  /** Weight typed as string, converted to number in payload builder */
  weight_g: string | null;
}

/* ========================================================================
 * BULK SKU — ROW STATE
 * ===================================================================== */

/**
 * State for a single row inside the bulk SKU creation table.
 *
 * Unlike `CreateSkuForm`:
 * - All fields are optional (rows may be partially filled)
 * - Fields may be string or number (depending on import/manual entry)
 * - Conversion happens in `buildBulkSkuPayload()`
 *
 * This format supports:
 * - CSV imports
 * - Manual row-by-row editing
 * - Auto-fill from dropdowns (SKU Code Base → brand/category)
 */
export interface BulkSkuRow {
  /** ID of the product associated with this row's SKU */
  product_id?: string;
  
  /** Brand code segment */
  brand_code?: string;
  
  /** Category code segment */
  category_code?: string;
  
  /** Variant segment ("S", "120", etc.) */
  variant_code?: string;
  
  /** Region code ("CA", "CN", "UN") */
  region_code?: string;
  
  /** Barcode typed or imported */
  barcode?: string;
  
  /** Language code ("EN", "EN-FR") */
  language?: string;
  
  /** Market region ("Canada") */
  market_region?: string;
  
  /** Display size ("60 Softgels") */
  size_label?: string;
  
  /** Optional description */
  description?: string;
  
  /** Dimensions (string, number, or null) */
  length_cm?: string | number | null;
  width_cm?: string | number | null;
  height_cm?: string | number | null;
  
  /** Weight (string, number, or null) */
  weight_g?: string | number | null;
}

/* ========================================================================
 * CREATE SKU FORM PROPS (Component Contract)
 * ===================================================================== */

/**
 * Top-level props for the Create SKU form component.
 *
 * Includes:
 * - Feature flags controlling whether code fields are editable
 * - Lookup bundles + handlers for Product and SKU Code Base dropdowns
 * - Submission status flags (loading, error, success)
 * - Factory response data after successful creation
 * - Utilities for resetting the form
 *
 * This interface defines the contract between:
 * - Container/page (logic + data)
 * - Presentation component (CreateSkuForm)
 */
export interface CreateSkuFormProps {
  /** Allow user to manually type brand/category codes */
  allowManualBrandCategory: boolean;
  
  /** Allow manual variant code entry */
  allowManualVariantCode: boolean;
  
  /** Allow manual region entry */
  allowManualRegionCode: boolean;
  
  /** Allow editing of market region text */
  allowManualMarketRegion: boolean;
  
  /**
   * Submit handler.
   * Accepts an array because bulk creation reuses the same logic.
   */
  onSubmit: (skus: CreateSkuInput[]) => Promise<void>;
  
  /** Whether the user has permission to create SKUs (RBAC) */
  canCreateSku?: boolean;
  
  /** Whether the create operation is currently in progress */
  isCreating: boolean;
  
  /** Error message returned from server or business logic */
  createError: string | null;
  
  /** Whether the creation succeeded */
  createSuccess: boolean;
  
  /** Optional returned payload from backend on success */
  createdResponse: any;
  
  /** Reset entire creation state (form + server flags) */
  resetCreateSkus: () => void;
  
  /** Lookup bundle for SKU Code Base (brand/category) */
  skuCodeBase: any;
  
  /** Lookup bundle for Product selection */
  product: any;
  
  /** Dropdown state for SKU Code Base */
  skuCodeBaseDropdown: any;
  
  /** Dropdown state for Product selection */
  productDropdown: any;
  
  /** Search handler for SKU Code Base lookup */
  handleSkuCodeBaseSearch: (v: string) => void;
  
  /** Search handler for Product lookup */
  handleProductSearch: (v: string) => void;
  
  /** Utility to extract brand/category codes from SKU base label */
  parseSkuCodeBaseLabel: (
    label: string
  ) => { brand_code: string; category_code: string };
}
