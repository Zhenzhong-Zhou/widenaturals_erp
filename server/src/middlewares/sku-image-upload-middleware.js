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
const { normalizeToArray } = require('../utils/array-utils');

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
 *
 * @description
 * Merges multipart-uploaded files (`req.files`) with the corresponding image
 * metadata defined in `req.body.skus[*].images`. This ensures each image object
 * is fully hydrated before Joi validation and downstream processing.
 *
 * This middleware is required because:
 *  - The client sends image metadata via JSON (image_type, alt_text, etc.).
 *  - Multer provides uploaded files separately through `req.files`.
 *  - The backend schema requires each image to contain either:
 *        • a valid `image_url`, OR
 *        • `file_uploaded = true`
 *    Therefore this step attaches the actual uploaded file paths to the JSON entries.
 *
 * Security & normalization:
 *  - All untrusted request inputs (`req.files`, `req.body.skus`, `sku.images`)
 *    are normalized into array form before processing.
 *  - This prevents type confusion and parameter tampering vulnerabilities
 *    (CWE-843), and resolves CodeQL security alerts.
 *
 * Core behaviors:
 *  - Iterates through all SKUs and their `images` arrays.
 *  - For each image with `file_uploaded = true`, assigns the next Multer file:
 *        • `image_url`   → server file path
 *        • `alt_text`    → preserved or defaulted to original filename
 *        • `source`      → "uploaded"
 *        • `uploaded_at` → ISO timestamp
 *
 * File-to-image mapping:
 *  - Uses sequential order: `req.files[fileIndex]` → next `image[file_uploaded = true]`.
 *  - Throws a validation error if:
 *        • More `file_uploaded = true` entries exist than uploaded files
 *        • Fewer entries exist and leftover files remain (mismatch)
 *
 * Pre-conditions:
 *  - Must run BEFORE Joi validation, since validation depends on enriched objects.
 *  - JSON body parsing middleware must run first so `req.body.skus` is available.
 *
 * @param {ExpressRequest & { body: any, files?: unknown }} req
 * @param {ExpressResponse} res
 * @param {NextFunction} next
 */
const attachUploadedFilesToSkus = (req, res, next) => {
  const files = normalizeToArray(req.files);
  const skus = normalizeToArray(req.body?.skus);
  
  if (!files.length || !skus.length) {
    return next();
  }
  
  let fileIndex = 0;
  
  for (const sku of skus) {
    const images = normalizeToArray(sku.images);
    
    for (const img of images) {
      if (img.file_uploaded) {
        const file = files[fileIndex];
        
        if (!file) {
          return next(
            AppError.validationError(
              "File count does not match 'file_uploaded' image entries."
            )
          );
        }
        
        img.image_url = file.path;
        img.alt_text = img.alt_text || file.originalname;
        img.source = 'uploaded';
        img.uploaded_at = new Date().toISOString();
        
        fileIndex++;
      }
    }
  }
  
  if (fileIndex !== files.length) {
    return next(
      AppError.validationError(
        `Received ${files.length} files but only ${fileIndex} were mapped.`
      )
    );
  }
  
  next();
};

module.exports = {
  parseSkuImageJson,
  attachUploadedFilesToSkus,
};
