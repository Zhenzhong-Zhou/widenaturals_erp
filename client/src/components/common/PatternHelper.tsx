import FieldStatusHelper from '@components/common/FieldStatusHelper';

/**
 * Generic JSX-based pattern validator for text inputs.
 *
 * This helper centralizes the logic used across all SKU form validators
 * (brand code, category code, variant, region, language, barcode, etc.)
 * and returns a `<FieldStatusHelper />` component representing:
 *
 * - **required** → field missing and required
 * - **invalid** → field present but does not match the regex
 * - **valid** → field present and matches regex
 * - **undefined** → optional + empty (no helper text shown)
 *
 * It is designed specifically for use inside form helperText props.
 *
 * @param value - The raw form value (string, null, or undefined)
 * @param required - Whether the field must be provided
 * @param regex - Validation pattern the value must satisfy
 * @returns JSX.Element | undefined - A `<FieldStatusHelper />` with status
 */
export const getPatternHelperText = (
  value: string | null | undefined,
  required: boolean,
  regex: RegExp
) => {
  const v = value ?? '';

  // Missing and required
  if (!v && required) {
    return <FieldStatusHelper status="required" />;
  }

  // Provided but does not satisfy pattern
  if (v && !regex.test(v)) {
    return <FieldStatusHelper status="invalid" />;
  }

  // Provided and valid
  if (v) {
    return <FieldStatusHelper status="valid" />;
  }

  // Optional + empty → no helper text
  return undefined;
};

/**
 * Shorthand helper for validating **required-only** text fields.
 *
 * Internally delegates to getPatternHelperText() using a universal
 * “non-empty” regex:
 *
 * - Required + empty → required
 * - Required + non-empty → valid
 * - Optional + empty → undefined (no helper)
 *
 * Useful for fields that do not need to pattern matching,
 * only presence validation.
 *
 * @param value - The raw form value (string, null, undefined)
 * @param required - Whether this field must contain a value
 * @returns JSX.Element | undefined
 */
export const buildRequiredHelper = (value: any, required: boolean) => {
  return getPatternHelperText(value, required, /.+/); // any non-empty string
};
