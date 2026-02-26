/**
 * @fileoverview
 * Express router for handling SKU image uploads (single or bulk).
 *
 * Features:
 *  - Uses Multer for temporary file handling
 *  - Validates request payload with Joi (bulkSkuImageUploadSchema)
 *  - Authorizes based on RBAC permission constants
 *  - Delegates processing to `uploadSkuImagesController`
 */

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const upload = require('../middlewares/multer-config');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const {
  bulkSkuImageUploadSchema, bulkSkuImageUpdateSchema,
} = require('../validators/sku-image-validators');
const {
  uploadSkuImagesController, updateSkuImagesController,
} = require('../controllers/sku-image-controller');
const {
  parseSkuImageJson,
  attachUploadedFilesToSkus,
} = require('../middlewares/sku-image-upload-middleware');

const router = express.Router();

/**
 * POST /upload
 *
 * Unified endpoint for uploading SKU images using multipart/form-data.
 * Supports hybrid payloads consisting of:
 *   • JSON metadata for SKUs (stringified in form-data)
 *   • Uploaded image files (handled by multer)
 *
 * This endpoint supports both single-SKU and multi-SKU upload batches.
 * The request body is normalized by middleware before validation,
 * allowing mixed image sources (URL-based and file-based) to coexist.
 *
 * Expected multipart/form-data structure:
 *
 *   Form Fields:
 *     skus: "[{ ... }]"   (stringified JSON array)
 *     files: <uploaded files>  (one file per SKU, matched by index)
 *
 * JSON Structure (after parsing):
 * {
 *   "skus": [
 *     {
 *       "skuId": "uuid",
 *       "skuCode": "PG-NM200-R-CN",
 *       "images": [
 *         {
 *           "image_type": "main",
 *           "alt_text": "Front view",
 *           "display_order": 0,
 *           "is_primary": true,
 *           "image_url": "https://example.com/img.jpg"  // URL image
 *         }
 *         // Uploaded file images are injected automatically:
 *         // {
 *         //   "image_url": "temp/uploads/xxx",
 *         //   "file_uploaded": true,
 *         //   "source": "uploaded"
 *         // }
 *       ]
 *     }
 *   ]
 * }
 *
 * Processing Pipeline:
 *   1. authorize() — verifies SKU image upload permission.
 *   2. upload.array('files') — extracts files via multer.
 *   3. parseSkuImageJson — parses and normalizes JSON "skus".
 *   4. attachUploadedFilesToSkus — injects uploaded file metadata.
 *   5. validate(bulkSkuImageUploadSchema) — validates final structure.
 *   6. uploadSkuImagesController — executes upload + DB insert workflow.
 *
 * Notes:
 *   • Uploaded images are aligned to SKUs by index (file[0] → skus[0]).
 *   • Each image must contain either:
 *        - image_url (URL or local path), OR
 *        - file_uploaded: true
 *   • Mixed URL + file uploads in the same request are fully supported.
 *   • Bulk upload supports up to 50 SKUs per request.
 */
router.post(
  '/upload',
  authorize([PERMISSIONS.SKUS.UPLOAD_IMAGE]),
  upload.array('files'),
  parseSkuImageJson,
  attachUploadedFilesToSkus,
  validate(bulkSkuImageUploadSchema, 'body'),
  uploadSkuImagesController
);

/**
 * @route POST /api/v1/skus/images/update
 *
 * @description
 * Handles bulk SKU image update requests.
 *
 * Pipeline:
 *   • Authorization check (SKUS.UPDATE_IMAGE permission required)
 *   • Multipart file parsing (multer)
 *   • JSON payload normalization for SKU image structure
 *   • Attachment of uploaded files to corresponding SKU objects
 *   • Schema validation (bulkSkuImageUpdateSchema)
 *   • Controller execution
 *
 * Behavior:
 *   • Supports mixed JSON + multipart uploads
 *   • Allows partial success per SKU
 *   • Delegates transactional logic to service layer
 *
 * Security:
 *   • Requires authenticated user
 *   • Requires SKUS.UPDATE_IMAGE permission
 *   • Validates request body before controller execution
 */
router.post(
  '/update',
  authorize([PERMISSIONS.SKUS.UPDATE_IMAGE]),
  upload.array('files'),
  parseSkuImageJson,
  attachUploadedFilesToSkus,
  validate(bulkSkuImageUpdateSchema, 'body'),
  updateSkuImagesController
);

module.exports = router;
