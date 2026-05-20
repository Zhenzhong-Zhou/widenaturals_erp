/**
 * @file sku-image-business.js
 * @description Domain business logic for SKU image insert normalization,
 * access control evaluation, and row-level field slicing.
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  SKU_IMAGES_CONSTANTS,
} = require('../utils/constants/domain/sku-constants');
const { logSystemException } = require('../utils/logging/system-logger');

const CONTEXT = 'sku-image-business';

/**
 * Normalizes a raw image metadata object into an insert-ready shape.
 *
 * `display_order` falls back to the item index when not explicitly provided.
 * `file_size_kb` is rounded to the nearest integer when finite.
 * `source` defaults to `'uploaded'` for audit traceability.
 *
 * @param {object} img - Raw image metadata from the caller.
 * @param {string} skuId - UUID of the SKU this image belongs to.
 * @param {string} userId - UUID of the user uploading the image.
 * @param {number} [index=0] - Position index used as `display_order` fallback.
 * @returns {object} Insert-ready image record.
 */
const normalizeSkuImageForInsert = (img, skuId, userId, index = 0) => ({
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
  created_at: new Date(),
  source: img.source || 'uploaded',
});

/**
 * Resolves which SKU image viewing capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<SkuImageViewAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateSkuImageViewAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateSkuImageViewAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewImages:
        isRoot ||
        permissions.includes(SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGES),
      canViewImageMetadata:
        isRoot ||
        permissions.includes(
          SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGE_METADATA
        ),
      canViewImageHistory:
        isRoot ||
        permissions.includes(
          SKU_IMAGES_CONSTANTS.PERMISSIONS.VIEW_IMAGE_HISTORY
        ),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate SKU image access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate SKU image access control.'
    );
  }
};

/**
 * Filters and shapes SKU image rows based on the user's image-view ACL.
 *
 * Returns an empty array when the input is invalid or the user cannot view SKU
 * images. Metadata and audit fields are included only when permitted by the
 * resolved ACL.
 *
 * @param {SkuImageRow[]} imageRows - Raw SKU image rows from the repository.
 * @param {SkuImageViewAcl} access - Resolved ACL from `evaluateSkuImageViewAccessControl`.
 * @returns {SkuImageForUser[]} Filtered and shaped image records safe for the current user.
 */
const sliceSkuImagesForUser = (imageRows, access) => {
  if (!Array.isArray(imageRows) || !access?.canViewImages) return [];
  
  return imageRows.map((row) => {
    /** @type {SkuImageForUser} */
    const safe = {
      id: row.id,
      groupId: row.group_id,
      imageUrl: row.image_url ?? null,
      type: row.image_type,
      isPrimary: Boolean(row.is_primary),
      altText: row.alt_text ?? null,
    };
    
    if (access.canViewImageMetadata) {
      safe.metadata = {
        sizeKb: row.file_size_kb ?? null,
        format: row.file_format ?? null,
        displayOrder: row.display_order ?? null,
      };
    }
    
    if (access.canViewImageHistory) {
      safe.audit = {
        uploadedAt: row.uploaded_at ?? null,
        uploadedBy: row.uploaded_by
          ? {
            id: row.uploaded_by,
            firstname: row.uploaded_by_firstname ?? null,
            lastname: row.uploaded_by_lastname ?? null,
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
