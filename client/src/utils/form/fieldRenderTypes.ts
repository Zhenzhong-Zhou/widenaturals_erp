import type { ComponentType, ReactNode } from 'react';

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
