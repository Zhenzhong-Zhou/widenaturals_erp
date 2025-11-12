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
      logSystemInfo('Existing SKU images found — upload blocked.', { context, skuId });
      throw AppError.validationError(
        `Images already exist for this SKU (${skuId}). To update, use the replace route instead.`
      );
    }
    
    logSystemInfo('No existing SKU images found, proceeding with upload.', { context, skuId });
  } catch (error) {
    logSystemException(error, 'Failed to check existing SKU images.', { context, skuId });
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
    
    throw AppError.databaseError('Failed to insert SKU images', { cause: error });
  }
};

module.exports = {
  assertNoExistingSkuImages,
  insertSkuImagesBulk,
};
