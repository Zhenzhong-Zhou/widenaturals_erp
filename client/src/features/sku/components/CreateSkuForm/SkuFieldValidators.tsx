import FieldStatusHelper from '@components/common/FieldStatusHelper';
import { getPatternHelperText } from '@components/common/PatternHelper';

/* ========================================================================
 * PRODUCT DROPDOWN VALIDATION
 * ===================================================================== */

/**
 * Helper text generator for the **Product** dropdown.
 *
 * Rules:
 * - If required and no value → "required"
 * - If value exists but not found in dropdown options → "invalid"
 * - If match found → "valid"
 *
 * Used by:
 * - renderProductDropdown()
 * - Single-SKU and Bulk-SKU creation forms
 *
 * @param value - The selected product ID from dropdown
 * @param required - Whether the field is mandatory
 * @param options - Available product options (value/label pairs)
 */
export const getProductHelperText = (
  value: string | null | undefined,
  required: boolean,
  options: any[]
) => {
  if (!value) {
    return required ? <FieldStatusHelper status="required" /> : undefined;
  }

  const exists = options.some((opt) => opt.value === value);
  if (!exists) {
    return <FieldStatusHelper status="invalid" />;
  }

  return <FieldStatusHelper status="valid" />;
};

/* ========================================================================
 * SKU CODE BASE VALIDATION
 * ===================================================================== */

/**
 * Helper text for the **SKU Code Base** lookup dropdown.
 *
 * Validation Logic:
 * - Required + empty → required
 * - Optional + empty → no helper
 * - Non-empty but missing in dropdown options → invalid
 * - Otherwise → valid
 *
 * @param value - Selected sku_code_base_id
 * @param required - Whether the field is mandatory
 * @param options - Dropdown items containing `{ value, label }`
 */
export const getSkuCodeBaseDropdownHelperText = (
  value: string | null,
  required: boolean,
  options: Array<{ value: string; label: string }>
) => {
  if (!value && required) {
    return <FieldStatusHelper status="required" />;
  }

  if (!value) return undefined;

  const exists = options.some((opt) => opt.value === value);
  if (!exists) {
    return <FieldStatusHelper status="invalid" />;
  }

  return <FieldStatusHelper status="valid" />;
};

/* ========================================================================
 * BRAND / CATEGORY CODE VALIDATION
 * ===================================================================== */

/**
 * Brand or Category code validator.
 *
 * Backend rule:
 * - Must be **2–5 uppercase letters**
 *
 * Example valid codes:
 * - PG
 * - WN
 * - CJ
 *
 * @param value - Input value
 * @param required - Whether field is required
 */
export const getBrandCategoryHelperText = (value: string, required: boolean) =>
  getPatternHelperText(value, required, /^[A-Z]{2,5}$/);

/* ========================================================================
 * VARIANT CODE VALIDATION
 * ===================================================================== */

/**
 * Variant code validator.
 *
 * Backend rule:
 * - Must be 1–10 uppercase alphanumeric characters
 * - Examples: "S", "M", "L", "120", "XL", "R"
 *
 * @param value - Raw variant code typed by user
 * @param required - Whether the field is mandatory
 */
export const getVariantCodeHelperText = (value: string, required: boolean) =>
  getPatternHelperText(value, required, /^[A-Z0-9]{1,10}$/);

/* ========================================================================
 * REGION CODE VALIDATION
 * ===================================================================== */

/**
 * Region code validator.
 *
 * Backend rule:
 * - Must be 2–5 uppercase letters (e.g., CA, CN, US, UN)
 *
 * @param value - Region code
 * @param required - Whether field is mandatory
 */
export const getRegionCodeHelperText = (value: string, required: boolean) =>
  getPatternHelperText(value, required, /^[A-Z]{2,5}$/);

/* ========================================================================
 * MARKET REGION VALIDATION
 * ===================================================================== */

/**
 * Market Region validator.
 *
 * Purpose:
 * - Allows only letters + spaces
 * - Used for textual regions like "Canada", "United States", etc.
 *
 * @param value - Market region string
 * @param required - Whether field is mandatory
 */
export const getMarketRegionHelperText = (value: string, required: boolean) =>
  getPatternHelperText(value, required, /^[A-Za-z ]+$/);

/* ========================================================================
 * BARCODE VALIDATION RULES
 * ===================================================================== */

/**
 * Standard barcode format definitions.
 *
 * Includes support for:
 * - EAN-13
 * - UPC-12
 * - GS1-8/GS1-14 (fallback)
 * - CODE128 alphanumeric
 * - INTERNAL (company-defined)
 */
export const BARCODE_RULES = {
  EAN13: /^[0-9]{13}$/,
  UPC12: /^[0-9]{12}$/,
  CODE128: /^[A-Za-z0-9\-.]{1,48}$/,
  INTERNAL: /^[A-Z0-9\-]{1,20}$/,
  GS1: /^[0-9]{8,14}$/,
};

/**
 * Detects the appropriate barcode validation rule from the input string.
 *
 * Detection order (top → bottom priority):
 *
 * 1. **EAN-13**
 *    - Exactly 13 digits
 *    - Retail international standard
 *
 * 2. **UPC-A (UPC-12)**
 *    - Exactly 12 digits
 *    - Standard in U.S. & Canada
 *
 * 3. **GS1-8**
 *    - Exactly 8 digits
 *    - Short GS1 format
 *
 * 4. **Internal / General Alphanumeric Barcode**
 *    - Matches: /^[0-9A-Za-z\-._\/ ]{1,64}$/
 *    - Supports internal codes, warehouse codes, Code39-safe formats
 *
 * 5. **Fallback**
 *    - Uses GS1 rule as safe numeric fallback
 *
 * @param val Raw barcode string typed or scanned by user.
 * @returns A RegExp representing the detected barcode rule.
 */
export const detectBarcodeRule = (val: string): RegExp => {
  const trimmed = val.trim();

  // 1. EAN-13 (13 digits)
  if (/^[0-9]{13}$/.test(trimmed)) return BARCODE_RULES.EAN13;

  // 2. UPC-A / UPC-12 (12 digits)
  if (/^[0-9]{12}$/.test(trimmed)) return BARCODE_RULES.UPC12;

  // 3. GS1-8 (8 digits)
  if (/^[0-9]{8}$/.test(trimmed)) return BARCODE_RULES.GS1;

  // 4. General internal alphanumeric barcode
  //     Supports Code39-safe characters: A-Z 0-9 - . _ / and space
  if (/^[0-9A-Za-z\-._\/ ]{1,64}$/.test(trimmed)) {
    return /^[0-9A-Za-z\-._\/ ]{1,64}$/;
  }

  // 5️⃣ Fallback numeric rule (GS1 recommended)
  return BARCODE_RULES.GS1;
};

/* ========================================================================
 * BARCODE VALIDATION
 * ===================================================================== */

/**
 * Generic barcode validator.
 *
 * Default rule:
 * - EAN-13 (13 digits)
 *
 * You may override `regex` to validate UPC-12, CODE128, INTERNAL, etc.
 *
 * @param value - Raw barcode string
 * @param required - Whether field must be provided
 * @param regex - The barcode pattern to validate against
 */
export const getBarcodeHelperText = (
  value: string,
  required: boolean,
  regex: RegExp = BARCODE_RULES.EAN13
) => {
  return getPatternHelperText(value, required, regex);
};

/* ========================================================================
 * LANGUAGE VALIDATION
 * ===================================================================== */

/**
 * Language code validator.
 *
 * Rules:
 * - Allows letters and dashes (e.g., "EN", "EN-FR")
 * - Matches backend SKU language field formatting
 *
 * @param value - Raw language input
 * @param required - Whether the field is mandatory
 */
export const getLanguageHelperText = (
  value: string | null | undefined,
  required: boolean
) => getPatternHelperText(value ?? '', required, /^[A-Za-z-]+$/);
