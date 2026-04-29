/**
 * @file validate.js
 * @description Express middleware factory for Joi schema validation.
 *
 * Validates `req.body`, `req.query`, or `req.params` against a Joi schema.
 *
 * On success:
 *   - `req.body`           → replaced in-place with the Joi-coerced value
 *   - `req.validatedQuery` → Joi-coerced value for query validation
 *   - `req.validatedParams`→ Joi-coerced value for params validation
 *
 * Why dedicated properties for query and params:
 *   `req.query` and `req.params` are read-only getters on Node's
 *   `IncomingMessage`. Reassigning them throws a TypeError, so coerced values
 *   are stored on custom properties instead. Downstream middleware must read
 *   from these validated properties — NOT from req.query / req.params — to
 *   get properly typed and defaulted values.
 *
 * Required middleware order (GET / lookup routes):
 *   sanitizeInput (global) → validate(schema, 'query') → normalizeQuery → controller
 *
 * `normalizeQuery` reads `req.validatedQuery` first. If validate has not run
 * before it, `req.validatedQuery` will be undefined and normalization will fall
 * back to raw `req.query` — causing pagination values like `offset` to remain
 * strings and defaults to never be applied. Always run validate before
 * normalizeQuery.
 *
 * On failure:
 *   Forwards a structured `AppError.validationError` with sanitized Joi
 *   details to the error handler pipeline.
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  sanitizeValidationError,
} = require('../utils/validation/sanitize-validation-error');

// -----------------------------------------------------------------------------
// Module-level constants
// -----------------------------------------------------------------------------

/** @type {Set<'body' | 'query' | 'params'>} */
const VALID_TARGETS = new Set(['body', 'query', 'params']);

/**
 * Default Joi validation options applied to every call unless overridden.
 *
 * - `abortEarly: false`   — collect all validation errors, not just the first
 * - `allowUnknown: false` — reject keys not declared in the schema
 *
 * @type {import('joi').ValidationOptions}
 */
const DEFAULT_JOI_OPTIONS = {
  abortEarly: false,
  allowUnknown: false,
};

/**
 * Maps each request target to the property where the validated value is stored.
 *
 * `body` is writable and is replaced directly.
 * `query` and `params` are read-only getters, so coerced values go to their
 * dedicated properties (`validatedQuery` / `validatedParams`).
 *
 * @type {Record<string, string>}
 */
const VALIDATED_TARGET_MAP = {
  body: 'body',
  query: 'validatedQuery',
  params: 'validatedParams',
};

// -----------------------------------------------------------------------------
// Middleware factory
// -----------------------------------------------------------------------------

/**
 * Creates an Express middleware that validates a request target against a
 * Joi schema and stores the coerced result for downstream use.
 *
 * Factory-time guards (executed once at route setup, not per request):
 *   - Verifies `schema` is a valid Joi schema with a `.validate()` method.
 *   - Verifies `target` is one of `'body'`, `'query'`, or `'params'`.
 *
 * For query validation the coerced result is written to `req.validatedQuery`.
 * Downstream middleware (e.g. `createQueryNormalizationMiddleware`) must read
 * from `req.validatedQuery` so that Joi-applied type coercions and defaults
 * (e.g. `offset` as a number, `limit` defaulting to 50) are respected.
 *
 * @param {import('joi').Schema}            schema        - Joi schema to validate against.
 * @param {'body'|'query'|'params'}         [target='body'] - Request property to validate.
 * @param {import('joi').ValidationOptions} [options={}]  - Joi options merged with defaults;
 *   caller-supplied values take precedence.
 * @param {string} [errorMessage='Validation failed.'] - Message used in the AppError on failure.
 * @returns {import('express').RequestHandler}
 * @throws {Error} At factory time if `schema` or `target` is invalid.
 *
 * @example
 * // Body validation — coerced value replaces req.body
 * router.post('/users', validate(createUserSchema), createUserHandler);
 *
 * @example
 * // Query validation — coerced value available on req.validatedQuery
 * // Must run BEFORE createQueryNormalizationMiddleware.
 * router.get(
 *   '/products',
 *   validate(productFilterSchema, 'query'),
 *   createQueryNormalizationMiddleware(...),
 *   listProductsHandler
 * );
 */
const validate = (
  schema,
  target = 'body',
  options = {},
  errorMessage = 'Validation failed.'
) => {
  // Factory-time guards — catch mis-configuration at startup, not per request.
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error(
      'validate(): invalid schema — expected a Joi schema with a .validate() method.'
    );
  }

  if (!VALID_TARGETS.has(target)) {
    throw new Error(
      `validate(): invalid target "${target}" — must be "body", "query", or "params".`
    );
  }

  const validationOptions = { ...DEFAULT_JOI_OPTIONS, ...options };
  const validatedTargetKey = VALIDATED_TARGET_MAP[target];

  // Per-request handler.
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], validationOptions);

    if (!error) {
      // body is writable and replaced in-place.
      // query and params go to their dedicated validated properties so
      // downstream middleware knows to read from the validated version.
      req[validatedTargetKey] = value;
      next();
      return;
    }

    // Strip Joi internals (context flags, raw values) before the error
    // reaches the client response.
    const sanitizedDetails = sanitizeValidationError(error);

    const appError = AppError.validationError(errorMessage, {
      details: sanitizedDetails,
    });

    next(appError);
  };
};

module.exports = validate;
