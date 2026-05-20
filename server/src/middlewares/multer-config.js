/**
 * @file multer-config.js
 * @module middleware/multer-config
 * @description Multer configuration for SKU image uploads (in-memory).
 *
 * Purpose:
 *   - Accept multipart/form-data image uploads on whitelisted MIME types.
 *   - Hold each file's bytes in a Buffer on the request object so the service
 *     layer can stream them straight into sharp + S3 without touching disk.
 *
 * Design principles:
 *   - Memory storage — no temp files, no disk cleanup contract, no ENOENT failure modes.
 *   - File size and count limits are environment-tunable.
 *   - MIME allowlist enforced in `fileFilter`, before any body bytes are buffered.
 *   - Raw `MulterError` instances are normalized to `AppError` at the source via
 *     `createUploadMiddleware`, so the global error handler only matches and responds.
 *   - The underlying multer handler is built once at factory time, not per request.
 *
 * Lifecycle:
 *   1. Multer parses the multipart body and exposes `req.file` / `req.files`
 *      with `buffer`, `mimetype`, and `originalname`.
 *   2. Service layer reads the buffer, resizes via sharp, uploads to S3.
 *   3. Buffer is released when the request scope ends — no explicit cleanup.
 *
 * Environment variables:
 *   UPLOAD_MAX_FILE_SIZE_MB - per-file size cap in MB (default: 10)
 *   UPLOAD_MAX_FILES        - max files per request (default: 20)
 *
 * Exports:
 *   - `createUploadMiddleware` — wraps a multer method call and normalizes
 *     raw MulterError instances before forwarding.
 */

'use strict';

const multer = require('multer');

const AppError = require('../utils/AppError');

const CONTEXT = 'middleware/upload';

// -----------------------------------------------------------------------------
// Limits — env-tunable so they can change without a code deploy.
// -----------------------------------------------------------------------------

const MAX_FILE_SIZE_MB = parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB, 10) || 10;
const MAX_FILES = parseInt(process.env.UPLOAD_MAX_FILES, 10) || 20;

// -----------------------------------------------------------------------------
// Allowed MIME types
// Explicit allowlist; anything not listed is rejected in `fileFilter` before
// the request body is buffered into memory.
// -----------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// -----------------------------------------------------------------------------
// Multer instance
// `memoryStorage` keeps each file in a Buffer on the request object. Suitable
// here because uploads are small (≤ MAX_FILE_SIZE_MB), short-lived, and
// immediately consumed by sharp + S3 — no benefit to round-tripping through disk.
// -----------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES,
  },
  
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      // Normalize at the source so the wrapper doesn't need MIME-specific logic
      // — it just forwards AppError instances as-is.
      cb(AppError.fileUploadError(`Unsupported file type: ${file.mimetype}.`));
      return;
    }
    cb(null, true);
  },
});

// -----------------------------------------------------------------------------
// Upload middleware factory
// -----------------------------------------------------------------------------

/**
 * Wrap a Multer method call so raw `MulterError` instances are normalized to
 * `AppError` at the source before forwarding via `next(err)`.
 *
 * Use this on all routes instead of calling `upload.single()` / `upload.array()`
 * directly — it keeps normalization at the boundary and means the global
 * error handler only has to match, log, and respond.
 *
 * The underlying multer handler is constructed once when the factory runs,
 * not per request, so route setup pays the cost and the hot path doesn't.
 *
 * @param {'single' | 'array' | 'fields' | 'none'} method
 *   Multer upload method to invoke.
 * @param {string | import('multer').Field[]} [arg]
 *   Field name (for `single` / `array`) or fields array (for `fields`).
 *   Omit for `none`.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/sku-images', createUploadMiddleware('single', 'image'), controller);
 *
 * @example
 * router.post('/sku-images', createUploadMiddleware('array', 'images'), controller);
 *
 * @example
 * router.post('/sku-images', createUploadMiddleware('fields', [
 *   { name: 'image', maxCount: 1 },
 * ]), controller);
 */
const createUploadMiddleware = (method, arg) => {
  // Build the multer handler once at factory time, not per request.
  const handler = arg !== undefined ? upload[method](arg) : upload[method]();
  
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();
      
      // Raw MulterError (size limit, file count, unexpected field) is normalized
      // here so downstream handlers don't have to branch on error class.
      // `meta` is included for logging context; AppError.toJSON() strips it from
      // the client response automatically.
      if (err instanceof multer.MulterError) {
        return next(
          AppError.fileUploadError(err.message || 'File upload failed.', {
            meta: {
              context: CONTEXT,
              field: err.field ?? null,
              errorCode: err.code ?? null,
            },
          })
        );
      }
      
      // AppError from fileFilter — or any other already-classified error —
      // forwards unchanged. Never re-wrap an AppError.
      return next(err);
    });
  };
};

module.exports = {
  createUploadMiddleware,
};
