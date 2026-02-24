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
const {
  validateUUID,
  createBooleanFlag,
  validateOptionalString
} = require('./general-validators');

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
 *  - `source`: classification of where the image came from.
 *
 * Important notes:
 *  - `sku_id` is intentionally omitted; it is injected later during
 *    normalization (e.g., `normalizeSkuImageForInsert`).
 *  - The schema does NOT validate the binary content of uploaded files;
 *    multer performs file extraction and format validation.
 */
const skuImageSchema = Joi.object({
    file_uploaded: createBooleanFlag('File Uploaded').default(false),
    
    image_url: Joi.alternatives()
      .try(
        Joi.string().uri({ allowRelative: true }).max(500),
        Joi.string().pattern(/^[\w\-./]+$/).max(500)
      )
      .allow(null, '')
      .messages({
        'alternatives.match':
          '"image_url" must be a valid URL or local file path',
      }),
    
    image_type: Joi.string()
      .valid('main', 'thumbnail', 'zoom', 'gallery', 'unknown')
      .default('unknown')
      .lowercase(),
    
    alt_text: validateOptionalString('Alt Text'),
    
    source: Joi.string()
      .valid('uploaded', 'synced', 'migrated', 'api', 'imported')
      .default('uploaded')
      .lowercase(),
  })
  .unknown(false)
  .messages({
    'any.custom': '{{#message}}',
  })
  .custom((value, helpers) => {
    const hasUrl = !!value.image_url;
    const hasFile = value.file_uploaded === true;
    
    if (!hasUrl && !hasFile) {
      return helpers.error('any.custom', {
        message: 'Either image_url or uploaded file is required.',
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
      }).unknown(false)
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one SKU must be provided.',
      'array.max': 'Cannot upload images for more than 50 SKUs per request.',
    }),
}).unknown(false);

/**
 * @schema updateSkuImageSchema
 *
 * @description
 * Validates a single image update payload for an existing SKU image group.
 *
 * Rules:
 *   • group_id is required
 *   • At least one updatable field must be present
 *   • Only 'main' image_type may set is_primary = true
 *   • file_format restricted to supported types
 *   • file_size_kb must be non-negative
 *   • Unknown fields are rejected
 *
 * Prevents empty or accidental no-op updates.
 */
const updateSkuImageSchema = Joi.object({
    group_id: validateUUID('Group ID').required(),
    
    file_uploaded: createBooleanFlag('File Uploaded').default(false),
    
    image_url: Joi.alternatives()
      .try(
        Joi.string().uri({ allowRelative: true }).max(500),
        Joi.string().pattern(/^[\w\-./]+$/).max(500)
      )
      .allow(null, '')
      .optional(),
    
    image_type: Joi.string()
      .valid('main', 'thumbnail', 'zoom', 'gallery', 'unknown')
      .lowercase()
      .optional(),
    
    display_order: Joi.number()
      .integer()
      .min(0)
      .optional(),
    
    alt_text: validateOptionalString('Alt Text'),
    
    file_format: Joi.string()
      .valid('jpg', 'jpeg', 'png', 'webp')
      .lowercase()
      .optional(),
    
    file_size_kb: Joi.number()
      .integer()
      .min(0)
      .optional(),
    
    is_primary: createBooleanFlag('Is Primary'),
    
    source: Joi.string()
      .valid('uploaded', 'synced', 'migrated', 'api', 'imported')
      .lowercase()
      .optional(),
  })
  .unknown(false)
  .messages({
    'any.custom': '{{#message}}',
  })
  .custom((value, helpers) => {
    // Prevent empty update
    const allowedFields = [
      'image_url',
      'image_type',
      'display_order',
      'alt_text',
      'file_format',
      'file_size_kb',
      'is_primary',
      'file_uploaded',
      'source',
    ];
    
    const hasUpdatableField = allowedFields.some(
      (field) => value[field] !== undefined
    );
    
    if (!hasUpdatableField) {
      return helpers.error('any.custom', {
        message: 'At least one updatable field must be provided.',
      });
    }
    
    if (
      value.is_primary === true &&
      value.image_type &&
      value.image_type !== 'main'
    ) {
      return helpers.error('any.custom', {
        message: 'Only image_type "main" can be marked as primary.',
      });
    }
    
    return value;
  });

/**
 * @schema updateSkuImageArraySchema
 *
 * @description
 * Validates an array of image update objects for a single SKU.
 *
 * Constraints:
 *   • Minimum 1 image update required
 *   • Maximum 100 image updates per SKU
 */
const updateSkuImageArraySchema = Joi.array()
  .items(updateSkuImageSchema)
  .min(1)
  .max(100)
  .required()
  .messages({
    'array.min': 'At least one image update is required.',
    'array.max': 'Cannot update more than 100 images per SKU.',
  });

/**
 * @schema bulkSkuImageUpdateSchema
 *
 * @description
 * Validates bulk image update requests across multiple SKUs.
 *
 * Constraints:
 *   • At least 1 SKU required
 *   • Maximum 50 SKUs per request
 *   • Each SKU must contain:
 *       - skuId (UUID)
 *       - skuCode (string)
 *       - images (validated image update array)
 *
 * Designed to prevent excessive batch processing and DB overload.
 */
const bulkSkuImageUpdateSchema = Joi.object({
  skus: Joi.array()
    .items(
      Joi.object({
        skuId: validateUUID('SKU ID'),
        skuCode: Joi.string()
          .trim()
          .max(100)
          .required()
          .label('SKU Code'),
        images: updateSkuImageArraySchema,
      }).unknown(false)
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one SKU must be provided.',
      'array.max':
        'Cannot update images for more than 50 SKUs per request.',
    }),
}).unknown(false);

module.exports = {
  skuImageSchema,
  skuImageArraySchema,
  bulkSkuImageUploadSchema,
  updateSkuImageSchema,
  updateSkuImageArraySchema,
  bulkSkuImageUpdateSchema,
};
