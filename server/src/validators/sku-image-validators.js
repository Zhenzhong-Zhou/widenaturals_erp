/**
 * @fileoverview
 * Validation schema for SKU image upload and metadata normalization.
 *
 * This module defines layered Joi schemas used to validate:
 *  - Individual SKU image metadata (`skuImageSchema`)
 *  - Arrays of images for a single SKU (`skuImageArraySchema`)
 *  - Full bulk upload request payloads (`bulkSkuImageUploadSchema`)
 *
 * These schemas ensure strict validation before persisting image records
 * into the database, enforcing data integrity, sensible limits, and
 * normalized structures between frontend and backend.
 *
 * Intended usage:
 *  - Controller: Validate incoming upload payloads (`bulkSkuImageUploadSchema`)
 *  - Service: Validate processed image metadata before DB insertion
 *  - Tests: Validate mock SKU image data consistency
 */

const Joi = require('joi');
const { validateUUID } = require('./general-validators');

/**
 * @constant
 * @description
 * Joi validation schema for a single SKU image definition.
 *
 * This schema supports both URL-based images and file-uploaded images
 * (as processed by multer during multipart/form-data uploads).
 *
 * Accepted sources of image metadata:
 *   - Client-provided JSON (URL images)
 *   - Multipart file uploads (`file_uploaded = true`)
 *   - System-generated or imported metadata (e.g., sync/migration jobs)
 *
 * Core validation rules:
 *  - `image_url` may be:
 *        • a full remote URL, or
 *        • a server-local file path (when images are uploaded and normalized)
 *    Empty values are allowed only when `file_uploaded = true`.
 *
 *  - `file_uploaded` indicates whether an uploaded file was included in
 *    the multipart request. Its presence ensures that an image exists
 *    even when `image_url` is not provided.
 *
 *  - The schema enforces that every image must contain ONE of:
 *        • a non-empty `image_url`, OR
 *        • `file_uploaded = true`
 *
 * Optional metadata:
 *  - `alt_text`: user-entered text for accessibility.
 *  - `image_type`: logical category (main, thumbnail, gallery, zoom, etc.).
 *  - `uploaded_at`: timestamp (defaults to current date if omitted).
 *  - `source`: classification of where the image came from.
 *
 * Important notes:
 *  - `sku_id` is intentionally omitted; it is injected later during
 *    normalization (e.g., `normalizeSkuImageForInsert`).
 *  - The schema does NOT validate the binary content of uploaded files;
 *    multer performs file extraction and format validation.
 */
const skuImageSchema = Joi.object({
  file_uploaded: Joi.boolean().default(false),

  image_url: Joi.alternatives()
    .try(
      Joi.string().uri({ allowRelative: true }).max(500),

      Joi.string()
        .pattern(/^[\w\-./]+$/) // allow local file paths
        .max(500)
    )
    .allow(null, '') // IMPORTANT to allow empty image_url when file uploaded
    .messages({
      'alternatives.match':
        '"image_url" must be a valid URL or local file path',
    }),

  image_type: Joi.string()
    .valid('main', 'thumbnail', 'zoom', 'gallery', 'unknown')
    .default('unknown')
    .insensitive(),
  
  alt_text: Joi.string().allow('', null).max(255),
  
  uploaded_at: Joi.date()
    .optional()
    .default(() => new Date()),

  source: Joi.string()
    .valid('uploaded', 'synced', 'migrated', 'api', 'imported')
    .default('uploaded'),
}).custom((value, helpers) => {
  const hasUrl = !!value.image_url;
  const hasFile = !!value.file_uploaded;

  if (!hasUrl && !hasFile) {
    return helpers.error('any.invalid', {
      message: 'Either image_url or uploaded file is required',
    });
  }

  return value;
});

/**
 * @constant
 * @description
 * Joi schema for validating multiple image entries for a single SKU.
 *
 * Enforces:
 *  - At least one image is provided per SKU
 *  - A maximum of 100 images per SKU
 *  - Each image object passes `skuImageSchema` validation
 */
const skuImageArraySchema = Joi.array()
  .items(skuImageSchema)
  .min(1)
  .max(100)
  .required()
  .messages({
    'array.min': 'At least one image is required.',
    'array.max': 'Cannot upload more than 100 images per SKU.',
  });

/**
 * @constant
 * @description
 * Joi schema for validating the entire bulk SKU image upload request body.
 *
 * Expected payload shape:
 * ```json
 * {
 *   "skus": [
 *     {
 *       "skuId": "uuid",
 *       "skuCode": "PG-NM200-R-CN",
 *       "images": [ ... ]
 *     }
 *   ]
 * }
 * ```
 *
 * Enforces:
 *  - Each SKU entry has a valid `skuId` and `skuCode`
 *  - Each SKU includes a valid `images` array
 *  - Batch size limited to 50 SKUs per request
 */
const bulkSkuImageUploadSchema = Joi.object({
  skus: Joi.array()
    .items(
      Joi.object({
        skuId: validateUUID('SKU ID'),
        skuCode: Joi.string().trim().required().label('SKU Code'),
        images: skuImageArraySchema,
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one SKU must be provided.',
      'array.max': 'Cannot upload images for more than 50 SKUs per request.',
    }),
});

module.exports = {
  skuImageSchema,
  skuImageArraySchema,
  bulkSkuImageUploadSchema,
};
