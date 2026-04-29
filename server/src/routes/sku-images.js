/**
 * @file sku-images.js
 * @description SKU image upload and update routes.
 * Handles single and bulk image operations via Multer-based multipart processing,
 * JSON parsing, file attachment, and Joi validation before delegating to the controller.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const { createUploadMiddleware } = require('../middlewares/multer-config');
const validate = require('../middlewares/validate');
const {
  parseSkuImageJson,
  attachUploadedFilesToSkus,
} = require('../middlewares/sku-image-upload');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  bulkSkuImageUploadSchema,
  bulkSkuImageUpdateSchema,
} = require('../validators/sku-image-validators');
const {
  uploadSkuImagesController,
  updateSkuImagesController,
} = require('../controllers/sku-image-controller');

const router = express.Router();

/**
 * @route POST /sku-images/upload
 * @description Upload one or more SKU images. Multipart files are received by Multer,
 * parsed and attached to their respective SKUs, then validated before processing.
 * @access protected
 * @permission PERMISSION_KEYS.SKUS.UPLOAD_IMAGE
 */
router.post(
  '/upload',
  authorize([PERMISSION_KEYS.SKUS.UPLOAD_IMAGE]),
  createUploadMiddleware('array', 'files'), // accepts multipart/form-data file array
  parseSkuImageJson, // parses JSON fields from multipart body
  attachUploadedFilesToSkus, // maps uploaded files to their SKU entries
  validate(bulkSkuImageUploadSchema, 'body'),
  uploadSkuImagesController
);

/**
 * @route POST /sku-images/update
 * @description Replace images for one or more SKUs. Follows the same multipart
 * pipeline as upload — Multer → parse → attach → validate — before delegating
 * to the update controller.
 * @access protected
 * @permission PERMISSION_KEYS.SKUS.UPDATE_IMAGE
 */
router.post(
  '/update',
  authorize([PERMISSION_KEYS.SKUS.UPDATE_IMAGE]),
  createUploadMiddleware('array', 'files'), // accepts multipart/form-data file array
  parseSkuImageJson, // parses JSON fields from multipart body
  attachUploadedFilesToSkus, // maps uploaded files to their SKU entries
  validate(bulkSkuImageUpdateSchema, 'body'),
  updateSkuImagesController
);

module.exports = router;
