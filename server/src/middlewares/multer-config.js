/**
 * @fileoverview
 * Multer configuration for temporary SKU image uploads.
 *
 * Purpose:
 *  - Accept multipart/form-data image uploads.
 *  - Store files temporarily under `temp/uploads/` before
 *    they are processed (resize, S3 upload, DB persistence).
 *
 * Design Principles:
 *  - Deterministic storage path (no implicit `dest` behavior).
 *  - Explicit directory creation to prevent ENOENT errors.
 *  - Controlled filename generation to preserve extensions.
 *  - File size limits to mitigate abuse.
 *  - MIME type validation to prevent unsafe file uploads.
 *
 * Lifecycle:
 *  1. Multer stores file in temp directory.
 *  2. Service layer resizes / uploads to S3.
 *  3. Service layer deletes temp file.
 *
 * IMPORTANT:
 *  - This middleware performs no business logic.
 *  - Cleanup responsibility belongs to the service layer.
 *  - Never delete the entire temp directory during request lifecycle.
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AppError = require('../utils/AppError');

// -----------------------------------------------------------------------------
// Ensure temp upload directory exists before handling requests
// -----------------------------------------------------------------------------
const uploadDir = path.resolve('temp/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// -----------------------------------------------------------------------------
// Allowed image MIME types
// -----------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// -----------------------------------------------------------------------------
// Disk storage configuration
// -----------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// -----------------------------------------------------------------------------
// Multer instance
// -----------------------------------------------------------------------------
const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 100, // prevent bulk abuse
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        AppError.validationError(`Unsupported file type: ${file.mimetype}`)
      );
    }
    cb(null, true);
  },
});

module.exports = upload;
