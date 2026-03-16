const { authorize } = require('../../middlewares/authorize');
const createQueryNormalizationMiddleware = require('../../middlewares/query-normalization');
const { sanitizeFields } = require('../../middlewares/sanitize');
const validate = require('../../middlewares/validate');

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * @typedef {object} LookupRoute
 * @property {string} path
 * @property {RequestHandler[]} handlers
 */

/**
 * @typedef {object} LookupRouteConfig
 * @property {string[]} [arrayKeys=[]]
 * @property {string[]} [booleanKeys=[]]
 * @property {string[]} [filterKeys=['keyword']]
 * @property {boolean} [includePagination=true]
 * @property {boolean} [includeSorting=false]
 * @property {string[]} [sanitizeFields=['keyword']]
 * @property {string[]} [optionBooleanKeys=[]]
 * @property {string[]} [optionKeys=[]]
 * @property {RequestHandler[]} [customHandlers=[]]
 */

/**
 * Factory to create standardized lookup route definitions.
 *
 * This function builds a complete middleware pipeline for lookup endpoints,
 * but does NOT register it to Express. Registration is handled separately
 * (e.g., via `registerLookupRoute`).
 *
 * ------------------------------------------------------------------
 * Middleware Pipeline (execution order)
 * ------------------------------------------------------------------
 * 1. authorize → permission enforcement
 * 2. normalize → transform query into filters + pagination
 * 3. sanitize → clean user input
 * 4. validate → Joi schema validation
 * 5. customHandlers (optional extension point)
 * 6. controller → execute business logic + response formatting
 *
 * ------------------------------------------------------------------
 *
 * @param {object} options
 * @param {string} options.path
 * @param {string[]} options.permission
 * @param {object} options.schema
 * @param {RequestHandler} options.controller
 * @param {LookupRouteConfig} [options.config]
 *
 * @returns {LookupRoute}
 */
const createLookupRoute = ({
                             path,
                             permission,
                             schema,
                             controller,
                             config = {},
                           }) => {
  //---------------------------------------------------------
  // Validate inputs (fail fast)
  //---------------------------------------------------------
  if (!path) {
    throw new Error('[createLookupRoute] path is required');
  }
  
  if (!Array.isArray(permission) || permission.length === 0) {
    throw new Error(
      '[createLookupRoute] permission must be a non-empty array'
    );
  }
  
  if (!schema) {
    throw new Error('[createLookupRoute] schema is required');
  }
  
  if (typeof controller !== 'function') {
    throw new Error('[createLookupRoute] controller must be a function');
  }
  
  //---------------------------------------------------------
  // Normalize config with defaults
  //---------------------------------------------------------
  const {
    arrayKeys = [],
    booleanKeys = [],
    filterKeys = ['keyword'],
    includePagination = true,
    includeSorting = false,
    sanitizeFields: fieldsToSanitize = ['keyword'],
    optionBooleanKeys = [],
    optionKeys = [],
    customHandlers = [],
  } = config;
  
  //---------------------------------------------------------
  // Build middleware pipeline
  //---------------------------------------------------------
  const handlers = [
    //---------------------------------------------------------
    // Authorization (ACL enforcement)
    //---------------------------------------------------------
    authorize(permission),
    
    //---------------------------------------------------------
    // Query normalization → structured filters + pagination
    //---------------------------------------------------------
    createQueryNormalizationMiddleware(
      '',
      arrayKeys,
      booleanKeys,
      filterKeys,
      {
        includePagination,
        includeSorting,
        optionBooleanKeys,
        optionKeys
      }
    ),
    
    //---------------------------------------------------------
    // Input sanitization (prevent injection / malformed input)
    //---------------------------------------------------------
    sanitizeFields(fieldsToSanitize),
    
    //---------------------------------------------------------
    // Validation (Joi schema)
    //---------------------------------------------------------
    validate(
      schema,
      'query',
      {
        abortEarly: false,
        convert: true,
      },
      'Invalid lookup query parameters.'
    ),
    
    ...customHandlers,
    
    //---------------------------------------------------------
    // Controller execution
    //---------------------------------------------------------
    controller,
  ];
  
  //---------------------------------------------------------
  // Return route definition (not registered yet)
  //---------------------------------------------------------
  return {
    path,
    handlers,
  };
};

module.exports = {
  createLookupRoute,
};
