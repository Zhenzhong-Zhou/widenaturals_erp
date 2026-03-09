const AppError = require('../utils/AppError');
const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  SKU_IMAGES_CONSTANTS,
} = require('../utils/constants/domain/sku-constants');
const { logSystemException } = require('../utils/system-logger');

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
    throw AppError.validationError(
      'Invalid image metadata provided to normalizeSkuImageForInsert'
    );
  }

  return {
    group_id: img.group_id,
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
      isRoot ||
      permissions.includes(SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGES);

    // Extended: Can view file metadata (size, format, order, etc.)?
    const canViewImageMetadata =
      isRoot ||
      permissions.includes(
        SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGE_METADATA
      );

    // Extended: Can view audit info (uploaded_at, uploaded_by)?
    const canViewImageHistory =
      isRoot ||
      permissions.includes(SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGE_HISTORY);

    return {
      canViewImages,
      canViewImageMetadata,
      canViewImageHistory,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate SKU image access control', {
      context: 'sku-image-business/evaluateSkuImageViewAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate SKU image access control.',
      { details: err.message }
    );
  }
};

/**
 * Business: Apply permission-based visibility slicing to raw SKU image rows.
 *
 * This function:
 *   • Filters out images entirely if user lacks VIEW_IMAGES
 *   • Selectively exposes metadata and audit fields based on access flags
 *   • Normalizes snake_case DB fields into camelCase
 *   • Preserves groupId for later grouping transformation
 *
 * ⚠️ Important:
 * This function DOES NOT group images.
 * It returns a flat list of permission-safe image rows.
 * Grouping into logical image variants must be done by
 * transformSkuImageGroupsForDetail().
 *
 * Performance:
 *   - O(n) linear pass
 *   - No deep cloning
 *   - No additional DB access
 *   - Pure transformation
 *
 * ------------------------------------------------------------------
 * Raw DB Row Shape
 * ------------------------------------------------------------------
 *
 * @typedef {Object} RawImageRow
 * @property {string} id
 * @property {string} group_id
 * @property {string} image_url
 * @property {string} image_type
 * @property {boolean} is_primary
 * @property {string} alt_text
 * @property {number|null} file_size_kb
 * @property {string|null} file_format
 * @property {number|null} display_order
 * @property {string|null|Date} uploaded_at
 * @property {string|null} uploaded_by
 * @property {string|null} uploaded_by_firstname
 * @property {string|null} uploaded_by_lastname
 *
 * ------------------------------------------------------------------
 * Access Control Shape
 * ------------------------------------------------------------------
 *
 * @typedef {Object} SkuImageAccess
 * @property {boolean} canViewImages
 * @property {boolean} canViewImageMetadata
 * @property {boolean} canViewImageHistory
 *
 * ------------------------------------------------------------------
 * Returned Flat Image Shape (Permission-Safe)
 * ------------------------------------------------------------------
 *
 * @typedef {Object} SlicedSkuImage
 * @property {string} id
 * @property {string} groupId
 * @property {string} imageUrl
 * @property {string} type
 * @property {boolean} isPrimary
 * @property {string} altText
 * @property {Object} [metadata]
 * @property {number|null} metadata.sizeKb
 * @property {string|null} metadata.format
 * @property {number|null} metadata.displayOrder
 * @property {Object|null} [audit]
 * @property {string|Date|null} audit.uploadedAt
 * @property {Object|null} audit.uploadedBy
 * @property {string} audit.uploadedBy.id
 * @property {string|null} audit.uploadedBy.firstname
 * @property {string|null} audit.uploadedBy.lastname
 *
 * ------------------------------------------------------------------
 *
 * @param {Array<RawImageRow>} imageRows
 *        Raw DB rows from repository.
 *
 * @param {SkuImageAccess} access
 *        Result of evaluateSkuImageViewAccessControl().
 *
 * @returns {Array<SlicedSkuImage>}
 *          Flat, permission-safe image rows ready for grouping.
 */
const sliceSkuImagesForUser = (imageRows, access) => {
  if (!Array.isArray(imageRows)) return [];

  // If user cannot view images at all → return empty immediately
  if (!access.canViewImages) return [];

  return imageRows.map((row) => {
    const safe = {
      id: row.id,
      groupId: row.group_id,
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
        uploadedBy: row.uploaded_by
          ? {
              id: row.uploaded_by,
              firstname: row.uploaded_by_firstname,
              lastname: row.uploaded_by_lastname,
            }
          : null,
      };
    }

    return safe;
  });
};

module.exports = {
  normalizeSkuImageForInsert,
  evaluateSkuImageViewAccessControl,
  sliceSkuImagesForUser,
};
