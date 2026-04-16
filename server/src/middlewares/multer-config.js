/**
 * @file multer-config.js
 * @description Multer configuration for temporary SKU image uploads.
 *
 * Purpose:
 *   - Accept multipart/form-data image uploads.
 *   - Store files temporarily under `temp/uploads/` before they are
 *     processed by the service layer (resize, S3 upload, DB persistence).
 *
 * Design principles:
 *   - Deterministic storage path (no implicit `dest` behaviour).
 *   - Explicit directory creation at module load to prevent ENOENT errors.
 *   - Cryptographically random filenames to eliminate collision risk.
 *   - File size and count limits configurable via environment variables.
 *   - MIME type validation to reject unsafe file uploads early.
 *   - Raw MulterError instances are normalized to AppError at the source
 *     via `createUploadMiddleware` so error handlers only match and respond.
 *
 * Lifecycle:
 *   1. Multer stores the file in the temp directory.
 *   2. Service layer resizes and uploads to S3.
 *   3. Service layer deletes the temp file.
 *
 * Responsibilities:
 *   - This middleware performs no business logic.
 *   - Temp file cleanup belongs to the service layer.
 *   - Never delete the entire temp directory during a request lifecycle.
 *
 * Environment variables:
 *   UPLOAD_MAX_FILE_SIZE_MB — maximum file size in MB (default: 50)
 *   UPLOAD_MAX_FILES        — maximum number of files per request (default: 100)
 *
 * Exports:
 *   - `upload`                — raw configured Multer instance (use via
 *                               `createUploadMiddleware`, not directly).
 *   - `createUploadMiddleware` — wraps a Multer method call to intercept and
 *                               normalize raw MulterError before forwarding.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/logging/system-logger');

const CONTEXT = 'middleware/upload';

// -----------------------------------------------------------------------------
// Temp upload directory
// Created synchronously at module load so the path is guaranteed to exist
// before the first request arrives. Failure here is fatal and logged before
// rethrowing so the crash appears in structured logs.
// -----------------------------------------------------------------------------
const uploadDir = path.resolve('temp/uploads');

try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (error) {
  logSystemException(error, 'Failed to create temp upload directory', {
    context: CONTEXT,
    uploadDir,
  });
  throw error;
}

// -----------------------------------------------------------------------------
// Limits — read from env so they can be tuned without a code change
// -----------------------------------------------------------------------------
const MAX_FILE_SIZE_MB =
  parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB, 10) || 50;
const MAX_FILES = parseInt(process.env.UPLOAD_MAX_FILES, 10) || 100;

// -----------------------------------------------------------------------------
// Allowed MIME types
// Explicit allowlist — any type not listed here is rejected by fileFilter.
// -----------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// -----------------------------------------------------------------------------
// Storage configuration
// -----------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    // crypto.randomBytes produces a collision-resistant name without relying
    // on Math.random(), which is not cryptographically safe.
    const uniquePrefix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${uniquePrefix}${ext}`);
  },
});

// -----------------------------------------------------------------------------
// Multer instance
// -----------------------------------------------------------------------------

/**
 * Configured Multer instance.
 *
 * Do NOT use this directly on routes — use `createUploadMiddleware` instead
 * so that raw MulterError instances are normalized to AppError before they
 * reach the error handler pipeline.
 *
 * Enforces:
 *   - Disk storage to `temp/uploads/`
 *   - Per-file size limit (`UPLOAD_MAX_FILE_SIZE_MB`, default 50 MB)
 *   - Per-request file count limit (`UPLOAD_MAX_FILES`, default 100)
 *   - MIME type allowlist (JPEG, PNG, WebP, GIF) via fileFilter
 *
 * @type {import('multer').Multer}
 */
const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES,
  },

  fileFilter: (_req, file, cb) => {
    // Reject unsupported MIME types immediately — normalized to AppError here
    // so the error reaches the handler pipeline already shaped correctly.
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
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
 * Wraps a Multer method call to intercept raw MulterError instances and
 * normalize them to AppError at the source before forwarding via next(err).
 *
 * Use this on all routes instead of calling `upload.single()` / `upload.array()`
 * directly. This keeps normalization at the source and ensures the
 * file-upload-error-handler only needs to match, log, and respond.
 *
 * @param {'single' | 'array' | 'fields' | 'none'} method
 *   Multer upload method to invoke.
 * @param {string | import('multer').Field[] | undefined} [arg]
 *   Field name (for `single` / `array`) or fields array (for `fields`).
 *   Omit for `none`.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Single file upload
 * router.post('/sku-images', createUploadMiddleware('single', 'image'), controller);
 *
 * @example
 * // Multiple files on one field
 * router.post('/sku-images', createUploadMiddleware('array', 'images'), controller);
 *
 * @example
 * // Multiple named fields
 * router.post('/sku-images', createUploadMiddleware('fields', [{ name: 'image', maxCount: 1 }]), controller);
 */
const createUploadMiddleware = (method, arg) => {
  // Build the multer handler once at factory time, not per request.
  const handler = arg !== undefined ? upload[method](arg) : upload[method]();

  return (req, res, next) => {
    handler(req, res, (err) => {
      // No error — continue to next middleware normally.
      if (!err) {
        next();
        return;
      }

      // Normalize raw MulterError (size limit, file count, unexpected field)
      // to AppError at the source. The file-upload-error-handler downstream
      // only needs to match type, log, and respond.
      if (err instanceof multer.MulterError) {
        return next(
          AppError.fileUploadError(err.message || 'File upload failed.', {
            // Capture multer-specific context for observability.
            // toJSON() strips meta so it never reaches the client response.
            meta: {
              field: err.field ?? null,
              errorCode: err.code ?? null,
            },
          })
        );
      }

      // AppError from fileFilter (MIME type rejection) — already normalized,
      // forward as-is. Unknown errors also forward as-is for globalErrorHandler.
      next(err);
    });
  };
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
  createUploadMiddleware,
};
