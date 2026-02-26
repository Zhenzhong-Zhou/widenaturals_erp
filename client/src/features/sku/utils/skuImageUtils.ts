import type {
  FlattenedImageMetadata,
  FormatterMap,
} from '@features/sku/state/skuTypes';
import { formatSize } from '@utils/textUtils';

/**
 * Convert raw metadata keys into clean, human-friendly labels.
 *
 * Supports:
 * - Special label overrides ("sizeKb" → "Size (KB)")
 * - Automatic camelCase → "Camel Case" conversion
 *
 * Used primarily in metadata tables and detail panels.
 *
 * @param key - The metadata field key
 * @returns Formatted label for UI display
 */
export const formatMetadataLabel = (key: string): string => {
  const SPECIAL_LABELS: Record<string, string> = {
    sizeKb: 'Size (KB)',
    isPrimary: 'Is Primary',
    uploadedAt: 'Uploaded At',
    uploadedBy: 'Uploaded By',
    displayOrder: 'Display Order',
  };

  // If explicitly mapped, use custom label
  if (SPECIAL_LABELS[key]) return SPECIAL_LABELS[key];

  // Insert spacing: sizeKb → size Kb
  const spaced = key.replace(/([A-Z])/g, ' $1').trim();

  // Capitalize initial letter
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Build an array of `{ label, value }` objects suitable for metadata display.
 *
 * Responsibilities:
 * - Converts nullish values into "—"
 * - Allows per-key custom formatters (FormatterMap)
 * - Auto-formats sizeKb using `formatSize`
 * - Automatically labels the field using `formatMetadataLabel()`
 *
 * @param flat - Flattened image metadata object
 * @param formatters - Optional dictionary of custom formatters (per field)
 *
 * @returns Array of:
 *   - `{ label: string, value: string }`
 */
export const buildImageMetadataFields = (
  flat: FlattenedImageMetadata | null,
  formatters: FormatterMap = {}
) => {
  if (!flat) return [];

  return (
    Object.entries(flat)
      .map(([key, rawValue]) => {
        // Fallback for null/undefined → consistent placeholder
        let value = rawValue ?? '—';

        // Auto-format file size (KB)
        if (key === 'sizeKb') {
          value = formatSize(rawValue as number, 'KB');
        }

        // Apply custom formatter if provided (e.g., convert userId → full name)
        const formatter = formatters[key];
        const formatted = formatter ? formatter(value) : value;

        return {
          label: formatMetadataLabel(key),
          value: formatted,
        };
      })
      // Remove fields with null/undefined values (unlikely after fallback)
      .filter((field) => field.value !== null && field.value !== undefined)
  );
};
