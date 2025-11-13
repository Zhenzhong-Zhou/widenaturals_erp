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
const multer = require('multer');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const { bulkSkuImageUploadSchema } = require('../validators/sku-image-validators');
const { uploadSkuImagesController } = require('../controllers/sku-image-controller');
const { parseSkuImageJson, attachUploadedFilesToSkus } = require('../middlewares/sku-image-upload-middleware');

const router = express.Router();

/**
 * Multer setup for temporary uploads.
 *
 * Notes:
 *  - Files are stored temporarily under `temp/uploads/` until processed by service layer.
 *  - Use a dedicated directory outside `src/` for better isolation and cleanup control.
 *  - File cleanup should be handled by the service or a background job after processing.
 */
const upload = multer({
  dest: 'temp/uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max per file
    files: 100, // Prevent abuse in bulk uploads
  },
});

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

module.exports = router;
