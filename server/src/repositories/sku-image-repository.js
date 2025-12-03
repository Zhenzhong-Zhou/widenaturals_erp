const { bulkInsert, query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * @async
 * @function
 * @description
 * Ensures that the given SKU does not already have any images in the database.
 * Throws a validation error if any images exist — enforcing immutable SKU image policy.
 *
 * @param {string} skuId - SKU UUID.
 * @param {object} client - PG transaction client.
 * @returns {Promise<void>}
 * @throws {AppError} If images already exist for this SKU.
 */
const assertNoExistingSkuImages = async (skuId, client) => {
  const context = 'sku-image-service/assertNoExistingSkuImages';
  const sql = `SELECT 1 FROM sku_images WHERE sku_id = $1 LIMIT 1;`;

  try {
    const { rows } = await query(sql, [skuId], client);

    if (rows.length > 0) {
      logSystemInfo('Existing SKU images found — upload blocked.', {
        context,
        skuId,
      });
      throw AppError.validationError(
        `Images already exist for this SKU (${skuId}). To update, use the replace route instead.`
      );
    }

    logSystemInfo('No existing SKU images found, proceeding with upload.', {
      context,
      skuId,
    });
  } catch (error) {
    logSystemException(error, 'Failed to check existing SKU images.', {
      context,
      skuId,
    });
    throw AppError.databaseError(
      'Failed to query sku_images table during existence check.',
      { cause: error }
    );
  }
};

/**
 * Inserts one or multiple SKU image records into the database.
 *
 * - Supports bulk insertion for efficiency.
 * - Handles duplicate (same sku_id + image_url) conflicts gracefully.
 * - Returns inserted or updated image records.
 *
 * @param {string} skuId - ID of the SKU these images belong to.
 * @param {Array<Object>} images - Array of image objects to insert.
 * @param createdBy
 * @param {object} client - PG transaction client.
 * @returns {Promise<Array>} Inserted or updated image rows.
 */
const insertSkuImagesBulk = async (skuId, images, createdBy, client) => {
  if (!Array.isArray(images) || images.length === 0) return [];

  const columns = [
    'sku_id',
    'image_url',
    'image_type',
    'display_order',
    'file_size_kb',
    'file_format',
    'alt_text',
    'is_primary',
    'uploaded_by',
  ];

  const rows = images.map((img, idx) => [
    skuId,
    img.image_url,
    img.image_type || null,
    img.display_order || idx + 1,
    img.file_size_kb ?? null,
    img.file_format ?? null,
    img.alt_text ?? null,
    img.is_primary ?? idx === 0, // default first as primary
    img.uploaded_by || createdBy,
  ]);

  // Conflict rule: avoid duplicate image for same SKU
  const conflictColumns = ['sku_id', 'image_url'];

  // Strategy: if same image re-inserted, refresh metadata & timestamp
  const updateStrategies = {
    alt_text: 'overwrite',
    display_order: 'overwrite',
    is_primary: 'overwrite',
    uploaded_at: 'overwrite', // applies NOW() via applyUpdateRule()
  };

  try {
    const result = await bulkInsert(
      'sku_images',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'sku-image-repository/insertSkuImagesBulk' },
      '*'
    );

    logSystemInfo('Successfully inserted or updated SKU images', {
      context: 'sku-image-repository/insertSkuImagesBulk',
      skuId,
      insertedCount: result.length,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to insert SKU images', {
      context: 'sku-image-repository/insertSkuImagesBulk',
      skuId,
      imageCount: images.length,
    });

    throw AppError.databaseError('Failed to insert SKU images', {
      cause: error,
    });
  }
};

/**
 * Fetch all images linked to a specific SKU.
 *
 * This repository returns **raw image rows**, including uploader metadata,
 * without applying permission filtering. All visibility rules must be applied
 * later using:
 *   - evaluateSkuImageViewAccessControl()
 *   - sliceSkuImagesForUser()
 *
 * ---------------------------------------------------------------------------
 * Returned row structure (raw DB fields):
 *
 *   [
 *     {
 *       id: string,
 *       sku_id: string,
 *       image_url: string,
 *       image_type: string,
 *       display_order: number,
 *       file_size_kb: number|null,
 *       file_format: string|null,
 *       alt_text: string|null,
 *       is_primary: boolean,
 *       uploaded_at: Date,
 *       uploaded_by: string|null,
 *       uploaded_by_firstname: string|null,   // from users.firstname
 *       uploaded_by_lastname: string|null     // from users.lastname
 *     },
 *     ...
 *   ]
 *
 * ---------------------------------------------------------------------------
 * Ordering rules:
 *   1. Primary image first:      is_primary DESC
 *   2. Then by display order:    display_order ASC
 *
 * ---------------------------------------------------------------------------
 * Notes:
 *   - This function does **not** hide metadata such as file size, file format,
 *     or uploader info — business layer decides what to hide.
 *   - If no images exist for the SKU, returns an empty array.
 *   - Fully safe for large SKUs because the query only hits indexed columns:
 *       - sku_id (FK)
 *       - is_primary
 *       - display_order
 *
 * ---------------------------------------------------------------------------
 * @async
 * @function
 *
 * @param {string} skuId - UUID of the SKU whose images should be loaded.
 *
 * @returns {Promise<Array<Object>>}
 *          Raw image records before slicing/transforming.
 *
 * @throws {AppError}
 *          When database query fails or connection issues occur.
 */
const getSkuImagesBySkuId = async (skuId) => {
  const context = 'sku-image-repository/getSkuImagesBySkuId';

  // ------------------------------------------------------------
  // SQL: Basic fetch from sku_images (no business slicing here)
  // ------------------------------------------------------------
  const sql = `
    SELECT
      img.id,
      img.sku_id,
      img.image_url,
      img.image_type,
      img.display_order,
      img.file_size_kb,
      img.file_format,
      img.alt_text,
      img.is_primary,
      img.uploaded_at,
      img.uploaded_by,
      u.firstname AS uploaded_by_firstname,
      u.lastname AS uploaded_by_lastname
    FROM sku_images AS img
    LEFT JOIN users AS u
      ON u.id = img.uploaded_by
    WHERE sku_id = $1
    ORDER BY
      is_primary DESC,
      display_order ASC
  `;

  try {
    const { rows } = await query(sql, [skuId]);

    if (rows.length === 0) {
      logSystemInfo('No SKU images found', {
        context,
        skuId,
      });
      return [];
    }

    logSystemInfo('Fetched SKU images successfully', {
      context,
      skuId,
      count: rows.length,
    });

    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU images', {
      context,
      skuId,
      error: error.message,
    });

    throw AppError.databaseError('Failed to fetch SKU images.', {
      context,
      details: error.message,
    });
  }
};

module.exports = {
  assertNoExistingSkuImages,
  insertSkuImagesBulk,
  getSkuImagesBySkuId,
};
