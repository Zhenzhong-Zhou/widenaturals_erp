/**
 * @file sanitization-utils.js
 * @description Low-level sanitization helpers called by the sanitize middleware.
 *
 * Sanitized values are stored on dedicated request properties
 * (`req.sanitizedBody`, `req.sanitizedQuery`, `req.sanitizedParams`) rather
 * than overwriting the originals. This preserves the raw values for debugging
 * and avoids the read-only getter restriction on `req.query` and `req.params`.
 */

'use strict';

const sanitizeRichText = require('./sanitize-html');
const customSanitization = require('./custom-sanitization');

/**
 * Sanitizes a specific subset of `req.body` fields and stores the results
 * in `req.sanitizedBody`.
 *
 * Results are merged into any existing `req.sanitizedBody` so that multiple
 * calls (e.g. global sanitizer then field-level sanitizer) accumulate rather
 * than overwrite each other.
 *
 * A field is skipped if it does not exist on `req.body` — falsy values such
 * as `0`, `false`, and `''` are sanitized normally since they are valid input.
 *
 * @param {import('express').Request & { sanitizedBody?: object }} req
 * @param {string[]} fields - Body field names to sanitize.
 * @param {boolean} [isRichText=false] - When `true`, fields are treated as
 *   HTML rich text and sanitized via `sanitizeRichText` instead of
 *   `customSanitization`.
 * @returns {void}
 */
const sanitizeRequestBody = (req, fields, isRichText = false) => {
  req.sanitizedBody ??= {};

  for (const field of fields) {
    // Use hasOwnProperty check so falsy values (0, false, '') are not skipped.
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, field)) {
      req.sanitizedBody[field] = isRichText
        ? sanitizeRichText(req.body[field])
        : customSanitization(req.body[field]);
    }
  }
};

/**
 * Sanitizes all query string parameters and stores the result in
 * `req.sanitizedQuery`.
 *
 * Does NOT overwrite `req.query` — it is a read-only getter on Node's
 * `IncomingMessage` and cannot be reassigned.
 *
 * @param {import('express').Request & { sanitizedQuery?: object }} req
 * @returns {void}
 */
const sanitizeQueryParams = (req) => {
  req.sanitizedQuery = customSanitization(req.query);
};

/**
 * Sanitizes all route parameters and stores the result in
 * `req.sanitizedParams`.
 *
 * Does NOT overwrite `req.params` — it is a read-only getter on Node's
 * `IncomingMessage` and cannot be reassigned.
 *
 * @param {import('express').Request & { sanitizedParams?: object }} req
 * @returns {void}
 */
const sanitizeParams = (req) => {
  req.sanitizedParams = customSanitization(req.params);
};

module.exports = {
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizeParams,
};
