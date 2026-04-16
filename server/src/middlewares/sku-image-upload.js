/**
 * @file sku-image-upload.js
 * @description Middleware utilities for handling SKU image uploads submitted
 * via multipart/form-data.
 *
 * These middlewares normalise the hybrid request structure that contains both
 * JSON (SKU metadata) and uploaded files (image binaries), and must run
 * BEFORE Joi validation so the schema receives a fully hydrated request body.
 *
 * Required execution order:
 *   1. `upload` (multer)              — stores files, populates req.files
 *   2. `parseSkuImageJson`            — parses req.body.skus from JSON string
 *   3. `attachUploadedFilesToSkus`    — merges req.files into req.body.skus
 *   4. Joi validation                 — validates the fully assembled body
 */

'use strict';

const AppError = require('../utils/AppError');
const { normalizeToArray } = require('../utils/array-utils');

// -----------------------------------------------------------------------------
// JSON parser
// -----------------------------------------------------------------------------

/**
 * Parses the `skus` field from a multipart/form-data request body.
 *
 * Multer does not parse JSON fields automatically — the frontend must
 * send SKU metadata as a stringified JSON array in a form field named `skus`.
 * This middleware converts that string to a JavaScript array before any
 * downstream middleware or validation runs.
 *
 * Must run BEFORE `attachUploadedFilesToSkus` and Joi validation.
 *
 * @example
 * // Incoming multipart field:
 * // skus: '[{"skuId":"abc","skuCode":"SKU-1","images":[...]}]'
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const parseSkuImageJson = (req, res, next) => {
  if (req.body?.skus && typeof req.body.skus === 'string') {
    try {
      req.body.skus = JSON.parse(req.body.skus);
    } catch {
      // JSON.parse failed — the client sent a malformed skus field.
      next(AppError.validationError("Invalid JSON in 'skus' field."));
      return;
    }
  }

  next();
};

// -----------------------------------------------------------------------------
// File attachment
// -----------------------------------------------------------------------------

/**
 * Merges Multer-uploaded files (`req.files`) into matching image metadata
 * entries in `req.body.skus`.
 *
 * Why this step is required:
 *   The client sends image metadata (type, alt text, etc.) as JSON and the
 *   actual file binaries as multipart uploads. Multer stores the binaries
 *   separately in `req.files`. This middleware hydrates each image object
 *   marked with `file_uploaded: true` with the resolved file path so that
 *   Joi validation and downstream service logic receive a complete structure.
 *
 * File-to-image mapping:
 *   Files are mapped sequentially — `req.files[n]` is assigned to the nth
 *   image entry where `file_uploaded === true`, in the order SKUs and their
 *   images appear in the array. A mismatch between uploaded file count and
 *   `file_uploaded` entry count is treated as a validation error.
 *
 * Security:
 *   All untrusted inputs (`req.files`, `req.body.skus`, `sku.images`) are
 *   normalised to arrays before iteration to prevent type confusion and
 *   parameter tampering (CWE-843).
 *
 * Must run AFTER `parseSkuImageJson` and BEFORE Joi validation.
 * Performs synchronous mutation only — no I/O, logging, or DB operations.
 *
 * @param {import('express').Request & { files?: Express.Multer.File[] }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const attachUploadedFilesToSkus = (req, res, next) => {
  const files = normalizeToArray(req.files);
  const skus = normalizeToArray(req.body?.skus);

  // No files uploaded or no SKUs present — nothing to merge.
  if (!files.length || !skus.length) {
    next();
    return;
  }

  let fileIndex = 0;

  for (const sku of skus) {
    const images = normalizeToArray(sku.images);

    for (const img of images) {
      if (img.file_uploaded !== true) continue;

      const file = files[fileIndex];

      // More file_uploaded entries than uploaded files — client mismatch.
      if (!file) {
        next(
          AppError.validationError(
            'File count does not match file_uploaded entries.'
          )
        );
        return;
      }

      img.image_url = file.path;

      // Preserve caller-supplied alt_text; fall back to the original filename.
      if (!img.alt_text) {
        img.alt_text = file.originalname;
      }

      // Default source to 'uploaded' if the client did not specify one.
      if (!img.source) {
        img.source = 'uploaded';
      }

      fileIndex++;
    }
  }

  // Extra uploaded files with no matching file_uploaded entry — client mismatch.
  if (fileIndex !== files.length) {
    next(
      AppError.validationError(
        `Received ${files.length} file(s) but only ${fileIndex} matched file_uploaded entries.`
      )
    );
    return;
  }

  next();
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
  parseSkuImageJson,
  attachUploadedFilesToSkus,
};
