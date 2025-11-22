/**
 * @fileoverview
 * Middleware utilities for handling SKU image uploads submitted via
 * multipart/form-data. These middlewares validate and normalize the
 * hybrid request structure that contains both JSON (SKUs metadata)
 * and uploaded files (image binaries).
 *
 * They are designed to run BEFORE Joi validation, allowing the final
 * request body to contain a consistent structure that the schema can
 * validate correctly.
 */

/**
 * @typedef {import('express').Request} ExpressRequest
 * @typedef {import('express').Response} ExpressResponse
 * @typedef {import('express').NextFunction} NextFunction
 */

const AppError = require('../utils/AppError');

/**
 * @function
 * @description
 * Parses the `skus` field from multipart/form-data into a JavaScript array.
 *
 * When uploading files, the frontend must send SKU metadata as a stringified
 * JSON array within a form-data field named `"skus"`. Multer does not parse
 * JSON fields automatically, so this middleware converts the value from string
 * → object.
 *
 * Example incoming multipart field:
 *   skus: '[{"skuId":"...","skuCode":"...","images":[...]}]'
 *
 * Responsibilities:
 *  - Detect when `skus` is a JSON string (due to multipart)
 *  - Safely parse the JSON
 *  - Throw an AppError for invalid JSON rather than letting Joi fail silently
 *
 * Must run BEFORE:
 *  - attachUploadedFilesToSkus()
 *  - Joi validation
 *
 * @param {ExpressRequest} req
 * @param {ExpressResponse} res
 * @param {NextFunction} next
 */
const parseSkuImageJson = (req, res, next) => {
  if (req.body?.skus && typeof req.body.skus === 'string') {
    try {
      req.body.skus = JSON.parse(req.body.skus);
    } catch (err) {
      return next(AppError.validationError("Invalid JSON in 'skus' field"));
    }
  }
  next();
};


/**
 * @function
 * @description
 * Injects uploaded file information into the corresponding SKU's `images` array.
 *
 * Multer provides uploaded files at `req.files`, and the JSON payload provides
 * image metadata in `req.body.skus[x].images`. This middleware merges the two
 * so each image entry satisfies backend validation and downstream processing.
 *
 * Key behaviors:
 *  - Maps `req.files[index]` → `req.body.skus[index]` (1 image per SKU)
 *  - Converts uploaded files into valid image objects by setting:
 *        • image_url (local path)
 *        • file_uploaded = true
 *        • alt_text (fallback: filename)
 *        • source = 'uploaded'
 *  - Upgrades the first image entry when the client supplies metadata-only
 *    (image_type, alt_text, etc.) but no image_url. This allows users to mark
 *    which image is “main” before uploading.
 *  - Otherwise, appends the file as a new image entry.
 *
 * Why this is necessary:
 *  - The Joi schema requires each image to have either:
 *        • image_url (URL or file path)
 *        • or file_uploaded = true
 *    Metadata-only images would fail validation without this step.
 *
 * Must run BEFORE Joi validation.
 *
 * @param {ExpressRequest & { body: any, files?: Array<any> }} req
 * @param {ExpressResponse} res
 * @param {NextFunction} next
 */
const attachUploadedFilesToSkus = (req, res, next) => {
  if (!req.files?.length || !req.body?.skus) {
    return next();
  }
  
  const skus = req.body.skus;
  
  req.files.forEach((file, index) => {
    const sku = skus[index];
    if (!sku) return;
    
    sku.images = sku.images || [];
    
    // Upgrade first metadata-only image to file-backed image
    if (
      sku.images[0] &&
      !sku.images[0].image_url &&
      !sku.images[0].file_uploaded
    ) {
      sku.images[0] = {
        ...sku.images[0],
        image_url: file.path,
        file_uploaded: true,
        source: 'uploaded',
        alt_text: sku.images[0].alt_text || file.originalname,
      };
    } else {
      // Otherwise append a new image entry
      sku.images.push({
        image_url: file.path,
        alt_text: file.originalname,
        file_uploaded: true,
        source: 'uploaded',
      });
    }
  });
  
  next();
};

module.exports = {
  parseSkuImageJson,
  attachUploadedFilesToSkus,
};
