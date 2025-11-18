const AppError = require('../utils/AppError');
const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { SKU_IMAGES_CONSTANTS } = require('../utils/constants/domain/sku-constants');
const { logSystemException } = require('../utils/system-logger');

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
    throw AppError.validationError('Invalid image metadata provided to normalizeSkuImageForInsert');
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

/**
 * Business: Evaluate whether the authenticated user can view SKU images
 * and which *levels* of metadata they may access.
 *
 * Permission model:
 *   VIEW_IMAGES            → Can view image URLs, primary flag, alt text
 *   VIEW_IMAGE_METADATA    → Can view technical metadata (size, type, format, order)
 *   VIEW_IMAGE_HISTORY     → Can view audit fields (uploaded_at, uploaded_by)
 *
 * This function returns BOOLEANS only. It does NOT fetch or modify data.
 * Used directly by `sliceSkuImagesForUser()` in the service layer.
 *
 * @param {Object} user - Authenticated user containing ID, role_id, and permissions.
 * @returns {Promise<{
 *   canViewImages: boolean,
 *   canViewImageMetadata: boolean,
 *   canViewImageHistory: boolean
 * }>}
 */
const evaluateSkuImageViewAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    // Basic permission: Can the user view the SKU images at all?
    const canViewImages =
      isRoot || permissions.includes(SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGES);
    
    // Extended: Can view file metadata (size, format, order, etc.)?
    const canViewImageMetadata =
      isRoot || permissions.includes(SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGE_METADATA);
    
    // Extended: Can view audit info (uploaded_at, uploaded_by)?
    const canViewImageHistory =
      isRoot || permissions.includes(SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGE_HISTORY);
    
    return {
      canViewImages,
      canViewImageMetadata,
      canViewImageHistory,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate SKU image access control',
      {
        context: 'sku-image-business/evaluateSkuImageViewAccessControl',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate SKU image access control.',
      { details: err.message }
    );
  }
};

/**
 * Business: Apply permission-based visibility slicing to SKU image rows.
 *
 * Removes or restricts fields depending on what the user is allowed to see.
 *
 * Returned structure:
 *   {
 *     imageUrl:   string,
 *     type:       string,
 *     isPrimary:  boolean,
 *     altText:    string,
 *
 *     metadata?: { sizeKb, format, displayOrder },
 *     audit?:    { uploadedAt, uploadedBy }
 *   }
 *
 * Performance:
 *   - O(n) linear pass
 *   - No deep cloning
 *   - No additional DB access
 *
 * @param {Array<Object>} imageRows - Raw DB rows from repository
 * @param {Object} access - Result of evaluateSkuImageViewAccessControl()
 * @returns {Array<Object>} Filtered and safe image objects
 */
const sliceSkuImagesForUser = (imageRows, access) => {
  if (!Array.isArray(imageRows)) return [];
  
  const result = [];
  
  for (const row of imageRows) {
    // If user cannot view images at all → skip completely
    if (!access.canViewImages) continue;
    
    // Base shared fields visible to EVERYONE with VIEW_IMAGES
    const safe = {
      imageUrl: row.image_url,
      type: row.image_type,
      isPrimary: row.is_primary,
      altText: row.alt_text,
    };
    
    // Optional: Extended metadata
    if (access.canViewImageMetadata) {
      safe.metadata = {
        sizeKb: row.file_size_kb,
        format: row.file_format,
        displayOrder: row.display_order,
      };
    }
    
    // Optional: Audit history
    if (access.canViewImageHistory) {
      safe.audit = {
        uploadedAt: row.uploaded_at,
        uploadedBy: row.uploaded_by,
      };
    }
    
    result.push(safe);
  }
  
  return result;
};

module.exports = {
  deduplicateSkuImages,
  normalizeSkuImageForInsert,
  evaluateSkuImageViewAccessControl,
  sliceSkuImagesForUser,
};
