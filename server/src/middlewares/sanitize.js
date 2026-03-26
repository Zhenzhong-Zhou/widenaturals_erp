/**
 * @file sanitize.js
 * @description Express middleware for sanitizing incoming request data.
 *
 * Exports:
 *   - `sanitizeInput`  — global middleware applied once in `middleware.js`.
 *     Sanitizes req.body, req.query, and req.params on every request before
 *     any route handler runs.
 *   - `sanitizeFields` — route-level factory for sanitizing specific body
 *     fields, used only on POST/PUT/PATCH routes that accept rich text or need
 *     field-level sanitization beyond what the global pass covers.
 *
 *    Do NOT use `sanitizeFields` on GET lookup routes.
 *     `sanitizeInput` already sanitizes req.query globally. `sanitizeFields`
 *     only touches req.body — on GET routes there is no body, so it is a
 *     no-op and adds unnecessary middleware overhead.
 *
 * Correct middleware order for lookup/GET routes:
 *   sanitizeInput (global) → validate → normalizeQuery → controller
 *
 * Correct middleware order for mutation (POST/PUT/PATCH) routes that need
 * rich-text or targeted body sanitization:
 *   sanitizeInput (global) → sanitizeFields → validate → controller
 */

'use strict';

const {
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizeParams,
} = require('../utils/sanitization-utils');
const AppError     = require('../utils/AppError');

// -----------------------------------------------------------------------------
// Global sanitizer
// -----------------------------------------------------------------------------

/**
 * Express middleware that sanitizes all incoming request data.
 *
 * Sanitizes:
 *   - `req.body`   — all fields (full key list derived from the body object)
 *   - `req.query`  — all query string parameters
 *   - `req.params` — all route parameters
 *
 * Registered once in `middleware.js` immediately after body parsing, so every
 * subsequent middleware and route handler receives clean, stripped input.
 * Because this runs globally, route-level `sanitizeFields` is redundant on
 * GET routes and should only be added on routes with body payloads.
 *
 * @type {import('express').RequestHandler}
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Derive the field list from the actual body keys so every field is
    // covered without callers needing to enumerate them explicitly.
    sanitizeRequestBody(req, Object.keys(req.body || {}));
    sanitizeQueryParams(req);
    sanitizeParams(req);
    
    next();
  } catch (error) {
    next(AppError.sanitizationError('Input sanitization failed.'));
  }
};

// -----------------------------------------------------------------------------
// Field-level sanitizer factory
// -----------------------------------------------------------------------------

/**
 * Express middleware factory that sanitizes a specific subset of body fields.
 *
 * Use only on POST / PUT / PATCH routes that accept rich text (HTML) or
 * require field-level sanitization rules beyond the global pass.
 * Do NOT use on GET routes — there is no body to sanitize, and `sanitizeInput`
 * already handled req.query.
 *
 * @param {string[]} fields - Body field names to sanitize.
 * @param {boolean}  [isRichText=false]
 *   When `true`, fields are treated as rich text and HTML is sanitized
 *   (tags stripped to safe subset) rather than removed entirely.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Mutation route — sanitize a rich-text body field before validation
 * router.post(
 *   '/products',
 *   sanitizeFields(['description'], true),
 *   validate(createProductSchema),
 *   createProductHandler
 * );
 */
const sanitizeFields = (fields, isRichText = false) => {
  return (req, res, next) => {
    try {
      sanitizeRequestBody(req, fields, isRichText);
      
      next();
    } catch (error) {
      next(AppError.sanitizationError('Field sanitization failed.'));
    }
  };
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
  sanitizeInput,
  sanitizeFields,
};
