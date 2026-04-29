/**
 * @file sku-image-media-repository.js
 * @description Database access layer for SKU image media records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from sku-image-media-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - hasPrimaryMainImage          — EXISTS check for primary main image
 *  - getSkuImageDisplayOrderBase  — fetch current max display_order for a SKU
 *  - insertSkuImagesBulk          — jsonb bulk insert with conflict handling
 *  - getSkuImagesBySkuId          — fetch all images for a SKU
 *  - getSkuImageGroupIdsBySku     — validate group_ids belong to a SKU
 *  - unsetPrimaryForSku           — clear is_primary on all images for a SKU
 *  - updateSkuImagesBulk          — jsonb bulk update by group_id
 */

'use strict';

const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  SKU_IMAGE_HAS_PRIMARY_MAIN_QUERY,
  SKU_IMAGE_MAX_DISPLAY_ORDER_QUERY,
  SKU_IMAGE_INSERT_BULK_QUERY,
  SKU_IMAGE_GET_BY_SKU_QUERY,
  SKU_IMAGE_GET_GROUP_IDS_QUERY,
  SKU_IMAGE_UNSET_PRIMARY_QUERY,
  SKU_IMAGE_UPDATE_BULK_QUERY,
} = require('./queries/sku-image-media-queries');

// ─── Existence Check ──────────────────────────────────────────────────────────

/**
 * Checks whether a primary main image exists for the given SKU.
 *
 * @param {string}                  skuId  - UUID of the SKU.
 * @param {PoolClient} client - DB client for transactional context.
 *
 * @returns {Promise<boolean>} True if a primary main image exists.
 * @throws  {AppError}          Normalized database error if the query fails.
 */
const hasPrimaryMainImage = async (skuId, client) => {
  const context = 'sku-image-media-repository/hasPrimaryMainImage';

  try {
    const { rows } = await query(
      SKU_IMAGE_HAS_PRIMARY_MAIN_QUERY,
      [skuId],
      client
    );
    return Boolean(rows[0]?.has_primary);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to check primary main image state.',
      meta: { skuId },
      logFn: (err) =>
        logDbQueryError(SKU_IMAGE_HAS_PRIMARY_MAIN_QUERY, [skuId], err, {
          context,
          skuId,
        }),
    });
  }
};

// ─── Display Order ────────────────────────────────────────────────────────────

/**
 * Fetches the current max display_order for a SKU's images.
 *
 * Returns 0 if no images exist — used as the base for ordering new images.
 *
 * @param {string}                  skuId  - UUID of the SKU.
 * @param {PoolClient} client - DB client for transactional context.
 *
 * @returns {Promise<number>} Current max display_order, or 0 if none exist.
 * @throws  {AppError}         Normalized database error if the query fails.
 */
const getSkuImageDisplayOrderBase = async (skuId, client) => {
  const context = 'sku-image-media-repository/getSkuImageDisplayOrderBase';

  try {
    const { rows } = await query(
      SKU_IMAGE_MAX_DISPLAY_ORDER_QUERY,
      [skuId],
      client
    );
    return Number(rows[0]?.max_order ?? 0);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU image display order base.',
      meta: { skuId },
      logFn: (err) =>
        logDbQueryError(SKU_IMAGE_MAX_DISPLAY_ORDER_QUERY, [skuId], err, {
          context,
          skuId,
        }),
    });
  }
};

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates SKU image records via jsonb_to_recordset.
 *
 * On conflict (sku_id, group_id, image_type), all mutable fields are overwritten.
 * Each image must include a valid group_id.
 *
 * @param {string}                  skuId     - UUID of the SKU.
 * @param {Array<Object>}           images    - Image objects to insert.
 * @param {string}                  createdBy - UUID of the user performing the insert.
 * @param {PoolClient} client    - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated image rows.
 * @throws  {AppError}               Validation error if any image is missing group_id.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertSkuImagesBulk = async (skuId, images, createdBy, client) => {
  if (!Array.isArray(images) || images.length === 0) return [];

  const context = 'sku-image-media-repository/insertSkuImagesBulk';

  const payload = images.map((img) => ({
    image_url: img.image_url,
    image_type: img.image_type,
    display_order: img.display_order,
    file_size_kb: img.file_size_kb ?? null,
    file_format: img.file_format ?? null,
    alt_text: img.alt_text ?? null,
    is_primary: img.is_primary ?? false,
    uploaded_by: img.uploaded_by || createdBy,
    group_id: img.group_id,
  }));

  // Validation before IO — must not be inside the try block.
  if (payload.some((p) => !p.group_id)) {
    throw AppError.validationError('group_id is required for each SKU image.', {
      context,
    });
  }

  const params = [skuId, JSON.stringify(payload)];

  try {
    const { rows } = await query(SKU_IMAGE_INSERT_BULK_QUERY, params, client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert SKU images.',
      meta: { skuId, imageCount: images.length },
      logFn: (err) =>
        logDbQueryError(SKU_IMAGE_INSERT_BULK_QUERY, params, err, {
          context,
          skuId,
        }),
    });
  }
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetches all image records for a given SKU.
 *
 * Returns an empty array if no images exist.
 * Ordered by primary main group first, then by group and display_order.
 *
 * @param {string} skuId - UUID of the SKU.
 *
 * @returns {Promise<Array<Object>>} Image rows with uploader audit fields.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getSkuImagesBySkuId = async (skuId) => {
  const context = 'sku-image-media-repository/getSkuImagesBySkuId';

  try {
    const { rows } = await query(SKU_IMAGE_GET_BY_SKU_QUERY, [skuId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU images.',
      meta: { skuId },
      logFn: (err) =>
        logDbQueryError(SKU_IMAGE_GET_BY_SKU_QUERY, [skuId], err, {
          context,
          skuId,
        }),
    });
  }
};

// ─── Group ID Validation ──────────────────────────────────────────────────────

/**
 * Returns group_ids from the input array that belong to the given SKU.
 *
 * Used to validate ownership before bulk operations — prevents cross-SKU
 * manipulation by filtering out group_ids that don't belong to this SKU.
 *
 * Returns an empty array if groupIds is empty.
 *
 * @param {string}                  skuId    - UUID of the SKU.
 * @param {string[]}                groupIds - Group UUIDs to validate.
 * @param {PoolClient} client   - DB client for transactional context.
 *
 * @returns {Promise<string[]>} Valid group_ids belonging to this SKU.
 * @throws  {AppError}           Validation error if skuId is not provided.
 * @throws  {AppError}           Normalized database error if the query fails.
 */
const getSkuImageGroupIdsBySku = async (skuId, groupIds, client) => {
  if (!skuId) {
    throw AppError.validationError('skuId is required.');
  }

  if (!Array.isArray(groupIds) || groupIds.length === 0) return [];

  const context = 'sku-image-media-repository/getSkuImageGroupIdsBySku';
  const params = [skuId, groupIds];

  try {
    const { rows } = await query(SKU_IMAGE_GET_GROUP_IDS_QUERY, params, client);
    return rows.map((r) => r.group_id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to validate SKU image groups.',
      meta: { skuId, groupCount: groupIds.length },
      logFn: (err) =>
        logDbQueryError(SKU_IMAGE_GET_GROUP_IDS_QUERY, params, err, {
          context,
          skuId,
        }),
    });
  }
};

// ─── Unset Primary ────────────────────────────────────────────────────────────

/**
 * Clears is_primary on all currently primary images for a SKU.
 *
 * Must be called before setting a new primary inside the same transaction
 * to enforce the single-primary-per-SKU invariant.
 *
 * @param {string}                  skuId      - UUID of the SKU.
 * @param {string}                  uploadedBy - UUID of the user performing the update.
 * @param {PoolClient} client     - DB client for transactional context.
 *
 * @returns {Promise<number>} Number of rows updated.
 * @throws  {AppError}         Validation error if skuId is not provided.
 * @throws  {AppError}         Normalized database error if the update fails.
 */
const unsetPrimaryForSku = async (skuId, uploadedBy, client) => {
  if (!skuId) {
    throw AppError.validationError('skuId is required.');
  }

  const context = 'sku-image-media-repository/unsetPrimaryForSku';
  const params = [skuId, uploadedBy];

  try {
    const { rowCount } = await query(
      SKU_IMAGE_UNSET_PRIMARY_QUERY,
      params,
      client
    );
    return rowCount;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to unset primary image.',
      meta: { skuId },
      logFn: (err) =>
        logDbQueryError(SKU_IMAGE_UNSET_PRIMARY_QUERY, params, err, {
          context,
          skuId,
        }),
    });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Bulk updates SKU image records by group_id via jsonb_to_recordset.
 *
 * Updates main/thumbnail/zoom rows conditionally based on image_type.
 * If any update sets is_primary, unsetPrimaryForSku is called first
 * within the same transaction to enforce single-primary invariant.
 *
 * @param {string}                  skuId      - UUID of the SKU.
 * @param {Array<Object>}           images     - Update payloads including group_id.
 * @param {string}                  uploadedBy - UUID of the user performing the update.
 * @param {PoolClient} client     - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Updated image rows sorted by display_order.
 * @throws  {AppError}               Validation error for invalid input.
 * @throws  {AppError}               Normalized database error if the update fails.
 */
const updateSkuImagesBulk = async (skuId, images, uploadedBy, client) => {
  if (!Array.isArray(images) || images.length === 0) return [];

  const context = 'sku-image-media-repository/updateSkuImagesBulk';

  // Validation before IO — must not be inside the try block.
  if (!skuId) {
    throw AppError.validationError('skuId is required.', { context });
  }

  if (images.some((u) => !u?.group_id)) {
    throw AppError.validationError(
      'Each image update must include a valid group_id.',
      { context }
    );
  }

  const primaryUpdates = images.filter((u) => u.is_primary === true);

  if (primaryUpdates.length > 1) {
    throw AppError.validationError(
      'Only one image group can be primary per SKU.',
      { context }
    );
  }

  // Unset existing primary before setting new one — must be in same transaction.
  if (primaryUpdates.length === 1) {
    await unsetPrimaryForSku(skuId, uploadedBy, client);
  }

  const params = [skuId, JSON.stringify(images), uploadedBy];

  try {
    const { rows } = await query(SKU_IMAGE_UPDATE_BULK_QUERY, params, client);
    return rows.sort((a, b) => a.display_order - b.display_order);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update SKU images.',
      meta: { skuId, imageCount: images.length },
      logFn: (err) =>
        logDbQueryError(SKU_IMAGE_UPDATE_BULK_QUERY, params, err, {
          context,
          skuId,
        }),
    });
  }
};

module.exports = {
  hasPrimaryMainImage,
  getSkuImageDisplayOrderBase,
  insertSkuImagesBulk,
  getSkuImagesBySkuId,
  getSkuImageGroupIdsBySku,
  unsetPrimaryForSku,
  updateSkuImagesBulk,
};
