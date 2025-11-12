/**
 * @function
 * @description
 * Removes duplicate image entries for the same SKU (same sku_id + image_url).
 *
 * @param {Array} images - Array of processed image objects.
 * @param {string} skuId - The SKU ID to scope deduplication.
 * @returns {Array} Unique images for insertion.
 */
const deduplicateSkuImages = (images = [], skuId) => {
  const seen = new Set();
  return images.filter((img) => {
    const key = `${skuId}-${img.image_url ?? img.imageUrl}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * @function
 * @description
 * Pre-insert normalization function that converts processed SKU image metadata
 * into a standardized record structure for insertion into the `sku_images` table.
 *
 * It ensures consistent casing, default fallbacks, and safe handling of missing fields.
 * Typically used within business/service layers (e.g., `saveSkuImagesService`).
 *
 * @param {Object} img - Processed image metadata returned from `processAndUploadSkuImages`.
 * @param {string} skuId - UUID of the associated SKU.
 * @param {string} userId - ID of the user performing the upload.
 * @param {number} index - Fallback index used for display_order if not provided.
 * @returns {Object} Normalized DB-ready image record.
 */
const normalizeSkuImageForInsert = (img, skuId, userId, index = 0) => {
  if (!img || typeof img !== 'object') {
    throw new Error('Invalid image metadata provided to normalizeSkuImageForInsert');
  }
  
  return {
    sku_id: skuId,
    image_url: String(img.image_url || '').trim(),
    image_type: String(img.image_type || 'unknown').toLowerCase(),
    display_order:
      typeof img.display_order === 'number'
        ? img.display_order
        : Number.isFinite(index)
          ? index
          : 0,
    file_size_kb: Number.isFinite(img.file_size_kb)
      ? Math.round(img.file_size_kb)
      : null,
    file_format: String(img.file_format || 'webp').toLowerCase(),
    alt_text: img.alt_text?.trim?.() || '',
    is_primary: Boolean(img.is_primary),
    uploaded_by: userId,
    created_at: new Date(), // optional if DB doesn’t auto-fill
    source: img.source || 'uploaded', // optional for audit
  };
};

module.exports = {
  deduplicateSkuImages,
  normalizeSkuImageForInsert,
};
