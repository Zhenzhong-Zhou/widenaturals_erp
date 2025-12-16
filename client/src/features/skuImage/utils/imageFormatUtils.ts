/**
 * Shared utility functions for SKU image upload workflows.
 *
 * This module centralizes common helpers used across:
 *  - Client-side preprocessing of image files (format detection, metadata extraction).
 *  - Normalization and serialization of image data into structures expected by the backend.
 *  - Mapping and enrichment helpers used in upload results (e.g., joining server rows with SKU metadata).
 *
 * The purpose of this module is to maintain a single, consistent source of logic
 * for transforming SKU image inputs and outputs, ensuring:
 *  - Predictable data shapes
 *  - Reusable formatting logic
 *  - Reduced duplication across components and hooks
 *
 * New helper functions may be added as needed without modifying this header,
 * as long as they relate to SKU image data processing.
 */

import type {
  BulkSkuImageUploadItem,
  BulkSkuImageUploadResult,
  ImageFileFormat,
  SkuImageUploadCardData,
} from '../state';

/**
 * Extract the file extension (format) from a given image File object.
 *
 * The format is derived from the MIME type, e.g.:
 *   - "image/jpeg" → "jpeg"
 *   - "image/png"  → "png"
 *
 * Only formats supported by the backend are returned.
 *
 * @param file - The uploaded File object from the client.
 * @returns The validated ImageFileFormat, or undefined if unsupported.
 */
export const getImageFileFormat = (
  file: File
): ImageFileFormat | undefined => {
  const ext = file.type.split("/")[1]?.toLowerCase();
  
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "tiff":
    case "svg":
      return ext as ImageFileFormat;
    
    default:
      return undefined;
  }
};

/**
 * Convert a list of SKU upload items into the clean,
 * backend-ready JSON structure used inside FormData.
 *
 * This strips UI-only properties (e.g., previewUrl, file object)
 * and ensures all optional fields have safe fallbacks.
 *
 * IMPORTANT:
 * This function does NOT attach binary files — just the metadata.
 * Files are appended separately inside buildFormData().
 *
 * @param items - Array of SKU entries containing image definitions.
 * @returns Serialized array of SKUs suitable for JSON.stringify() and API use.
 */
export const serializeBulkSkuImageUpload = (
  items: BulkSkuImageUploadItem[]
) => {
  return items.map(item => ({
    skuId: item.skuId,
    skuCode: item.skuCode,
    images: item.images.map(img => ({
      image_url: img.image_url ?? null,
      file_uploaded: Boolean(img.file),
      image_type: img.image_type ?? "thumbnail",
      alt_text: img.alt_text ?? "",
    }))
  }));
};

/**
 * Merges backend upload results with the corresponding SKU metadata
 * from the original client-side upload items.
 *
 * This utility ensures that the UI can display enriched information such as:
 * - Human-readable SKU code
 * - Product display name
 *
 * even when the backend only returns `{ skuId, success, error, images }`.
 *
 * Behavior:
 * - If `results` is null/undefined/not an array → returns an empty array.
 * - Each result row is augmented by matching `skuId` against the original items.
 * - If no matching item is found, falls back to:
 *     • `skuCode = skuId`
 *     • `productName = "Unknown Product"`
 *
 * Typical Use Case:
 * - After a bulk image upload, the server returns minimal result rows.
 * - The UI dialog needs richer display context for each SKU.
 *
 * @param results - Array of upload result objects returned from the backend.
 * @param items   - Original upload card items containing SKU metadata
 *                  (skuId, skuCode, displayProductName).
 *
 * @returns A new array of results enriched with `skuCode` and `productName`.
 */
export const enrichBulkSkuUploadResults = (
  results: BulkSkuImageUploadResult[] | null | undefined,
  items: SkuImageUploadCardData[]
) => {
  if (!Array.isArray(results)) return [];
  
  return results.map((r) => {
    const match = items.find((i) => i.skuId === r.skuId);
    
    return {
      ...r,
      skuCode: match?.skuCode ?? r.skuId,
      productName: match?.displayProductName ?? "Unknown Product",
    };
  });
};
