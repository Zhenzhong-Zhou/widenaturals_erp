import type {
  FlattenedImageMetadata,
  FormatterMap,
  SkuImage
} from '@features/sku/state/skuTypes';
import { formatSize } from '@utils/textUtils';

/**
 * Normalize a raw SKU image array into structured groups:
 *
 * - Deduplicates images by `imageUrl`
 * - Selects a **primary main image** (fallback to first main)
 * - Selects the **zoom image**
 * - Returns a **sorted list of thumbnails** by display order
 *
 * This is used by detail pages and tables to unify image handling logic.
 *
 * @param images - The raw array of SKU images
 * @returns Object containing:
 *   - `mainImage`: SkuImage | null
 *   - `zoomImage`: SkuImage | null
 *   - `thumbnails`: SkuImage[]
 */
export const normalizeSkuImages = (images: SkuImage[]) => {
  // Defensive fallback if server returns null or malformed structure
  if (!Array.isArray(images)) {
    return {
      thumbnails: [] as SkuImage[],
      mainImage: null as SkuImage | null,
      zoomImage: null as SkuImage | null,
    };
  }
  
  // --- Deduplicate images by URL (most reliable unique key) ------------------
  const uniqueImages = Array.from(
    new Map(images.map((img) => [img.imageUrl, img])).values()
  );
  
  // --- Main image selection: primary main → fallback main → null -------------
  const mainImage =
    uniqueImages.find((img) => img.type === "main" && img.isPrimary) ||
    uniqueImages.find((img) => img.type === "main") ||
    null;
  
  // --- Zoom image ------------------------------------------------------------
  const zoomImage =
    uniqueImages.find((img) => img.type === "zoom") || null;
  
  // --- Thumbnails (sorted by displayOrder or fallback to bottom) -------------
  const thumbnails = uniqueImages
    .filter((img) => img.type === "thumbnail")
    .sort(
      (a, b) =>
        (a.metadata.displayOrder ?? 999) -
        (b.metadata.displayOrder ?? 999)
    );
  
  return {
    thumbnails,
    mainImage,
    zoomImage,
  };
};

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
    sizeKb: "Size (KB)",
    isPrimary: "Is Primary",
    uploadedAt: "Uploaded At",
    uploadedBy: "Uploaded By",
    displayOrder: "Display Order",
  };
  
  // If explicitly mapped, use custom label
  if (SPECIAL_LABELS[key]) return SPECIAL_LABELS[key];
  
  // Insert spacing: sizeKb → size Kb
  const spaced = key.replace(/([A-Z])/g, " $1").trim();
  
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
  
  return Object.entries(flat)
    .map(([key, rawValue]) => {
      // Fallback for null/undefined → consistent placeholder
      let value = rawValue ?? "—";
      
      // Auto-format file size (KB)
      if (key === "sizeKb") {
        value = formatSize(rawValue as number, "KB");
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
    .filter((field) => field.value !== null && field.value !== undefined);
};
