import { getPatternHelperText } from '@components/common/PatternHelper';

/**
 * Regex used by both brand and category fields.
 *
 * Rules:
 * - Each word must start with a capital letter (A–Z)
 * - Following characters may include:
 *   letters, digits, apostrophes, &, +, /, -
 * - Multi-word values must have each word capitalized
 *
 * Examples of valid values:
 *   "Herbal Natural A"
 *   "Probiotic Plus"
 *   "Vitamin-C"
 */
const BRAND_CATEGORY_REGEX =
  /^[A-Z][a-zA-Z0-9'&+/-]*(\s+[A-Z][a-zA-Z0-9'&+/-]*)*$/;

/**
 * Generates helper text for "series", "brand", and "category" product fields.
 *
 * This wraps the generic `getPatternHelperText` and applies
 * the shared BRAND_CATEGORY_REGEX so the UI can show:
 *   - default helper text
 *   - validation hints
 *   - mismatch warnings (e.g., incorrect capitalization)
 *
 * @param value - Current input value from the form field
 * @param required - Whether the field is mandatory
 *
 * @returns A helper-text string (or undefined) suitable for
 *          BaseInput, TextField, or any MUI input-based component.
 *
 * @example
 * getSeriesBrandCategoryHelperText("herbal natural", true)
 * // => "Each word must start with a capital letter..."
 */
export const getSeriesBrandCategoryHelperText = (
  value: string,
  required: boolean
) => getPatternHelperText(value, required, BRAND_CATEGORY_REGEX);
