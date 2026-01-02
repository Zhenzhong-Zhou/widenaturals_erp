const { query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * @async
 * @function
 * @description
 * Checks whether a SKU already has a primary "main" image.
 *
 * This helper performs a fast existence check using a SQL `EXISTS` clause
 * and is typically used to enforce the rule that a SKU may have at most
 * one primary image at any given time.
 *
 * Guarantees:
 *  - Returns a strict boolean (`true` or `false`)
 *  - Does not modify any data
 *  - Efficient (stops at the first matching row)
 *  - Safe for use inside transactions
 *
 * @param {string} skuId
 *   UUID of the SKU to check.
 *
 * @param {object} client
 *   PostgreSQL client used for query execution (maybe a transaction client).
 *
 * @returns {Promise<boolean>}
 *   Resolves to `true` if a primary "main" image exists for the SKU,
 *   otherwise resolves to `false`.
 *
 * @throws {AppError}
 *   Throws a database error if the query fails.
 */
const hasPrimaryMainImage = async (skuId, client) => {
  const context = 'sku-image-service/hasPrimaryMainImage';

  const sql = `
    SELECT EXISTS (
      SELECT 1
      FROM sku_images
      WHERE sku_id = $1
        AND image_type = 'main'
        AND is_primary = TRUE
    ) AS has_primary;
  `;

  try {
    const { rows } = await query(sql, [skuId], client);

    const hasPrimary = Boolean(rows[0]?.has_primary);

    logSystemInfo('Primary main image existence check complete.', {
      context,
      skuId,
      hasPrimaryMain: hasPrimary,
    });

    return hasPrimary;
  } catch (error) {
    logSystemException(
      error,
      'Failed to query sku_images for primary main image.',
      {
        context,
        skuId,
      }
    );

    throw AppError.databaseError('Failed to check primary main image state.', {
      cause: error,
      skuId,
      context,
    });
  }
};

/**
 * @async
 * @function
 * @description
 * Returns the current maximum `display_order` value for images associated
 * with the given SKU.
 *
 * This value is used as the append base when uploading new images, ensuring
 * that newly inserted records receive deterministic and non-overlapping
 * `display_order` values.
 *
 * Guarantees:
 *  - Always resolves to a number (defaults to `0` when no images exist)
 *  - Read-only operation with no side effects
 *  - Safe for concurrent use within transactions
 *
 * @param {string} skuId
 *   UUID of the SKU whose image ordering state is being queried.
 *
 * @param {object} client
 *   PostgreSQL client used for query execution (maybe a transaction client).
 *
 * @returns {Promise<number>}
 *   Resolves to the maximum `display_order` currently stored for the SKU.
 *
 * @throws {AppError}
 *   Throws a database error if the query fails.
 */
const getSkuImageDisplayOrderBase = async (skuId, client) => {
  const context = 'sku-image-service/getSkuImageDisplayOrderBase';

  const sql = `
    SELECT COALESCE(MAX(display_order), 0) AS max_order
    FROM sku_images
    WHERE sku_id = $1;
  `;

  try {
    const result = await query(sql, [skuId], client);

    const count = Number(result.rows?.[0]?.count ?? 0);

    logSystemInfo('Counted existing SKU images.', {
      context,
      skuId,
      count,
    });

    return count;
  } catch (error) {
    logSystemException(error, 'Failed to count SKU images.', {
      context,
      skuId,
    });

    throw AppError.databaseError('Failed to count existing SKU images.', {
      cause: error,
      skuId,
      context,
    });
  }
};

/**
 * @async
 * @function
 * @description
 * Bulk inserts or updates SKU image records in a single, deterministic
 * database operation.
 *
 * This function accepts pre-processed image metadata (no file handling),
 * persists records using a JSON-based bulk insert, and relies on
 * database-level conflict handling for idempotency.
 *
 * Behavior and guarantees:
 *  - Inserts images in a deterministic order using (group_id, display_order)
 *  - Requires a `group_id` for every image to preserve batch ordering
 *  - Handles duplicate images safely via `(sku_id, image_url)` conflict rules
 *  - Updates mutable metadata (`alt_text`, `display_order`, `is_primary`)
 *    when conflicts occur
 *  - Does not generate or modify image files (metadata-only operation)
 *
 * Conflict strategy:
 *  - Uniqueness is enforced by `(sku_id, image_url)`
 *  - On conflict, existing rows are updated rather than duplicated
 *  - `uploaded_at` is refreshed on update to reflect the latest operation
 *
 * @param {string} skuId
 *   UUID of the SKU to which the images belong.
 *
 * @param {Array<Object>} images
 *   Array of normalized image metadata objects. Each object must include:
 *   - `image_url`
 *   - `display_order`
 *   - `group_id`
 *
 * @param {string} createdBy
 *   UUID of the user performing the insert or update.
 *
 * @param {object} client
 *   PostgreSQL client used for transactional execution.
 *
 * @returns {Promise<Array<Object>>}
 *   Resolves to the array of inserted or updated image rows as returned
 *   by the database.
 *
 * @throws {AppError}
 *   Throws a validation error if required fields (e.g. `group_id`) are missing,
 *   or a database error if the insert/update operation fails.
 */
const insertSkuImagesBulk = async (skuId, images, createdBy, client) => {
  if (!Array.isArray(images) || images.length === 0) return [];

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

  if (payload.some((p) => !p.group_id)) {
    throw AppError.validationError('group_id is required for SKU image insert');
  }

  const sql = `
    INSERT INTO sku_images (
      sku_id,
      image_url,
      image_type,
      display_order,
      file_size_kb,
      file_format,
      alt_text,
      is_primary,
      uploaded_by,
      group_id
    )
    SELECT
      $1 AS sku_id,
      t.image_url,
      t.image_type,
      t.display_order,
      t.file_size_kb,
      t.file_format,
      t.alt_text,
      t.is_primary,
      t.uploaded_by,
      t.group_id
    FROM jsonb_to_recordset($2::jsonb) AS t(
      image_url text,
      image_type text,
      display_order int,
      file_size_kb int,
      file_format text,
      alt_text text,
      is_primary boolean,
      uploaded_by uuid,
      group_id uuid
    )
    ORDER BY t.group_id, t.display_order
    ON CONFLICT (sku_id, image_url)
    DO UPDATE SET
      alt_text = EXCLUDED.alt_text,
      display_order = EXCLUDED.display_order,
      is_primary = EXCLUDED.is_primary,
      uploaded_at = NOW()
    RETURNING *;
  `;

  try {
    const { rows } = await query(sql, [skuId, JSON.stringify(payload)], client);

    logSystemInfo('Successfully inserted or updated SKU images', {
      context: 'sku-image-repository/insertSkuImagesBulk',
      skuId,
      affectedCount: rows.length,
    });

    return rows;
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
  hasPrimaryMainImage,
  getSkuImageDisplayOrderBase,
  insertSkuImagesBulk,
  getSkuImagesBySkuId,
};
