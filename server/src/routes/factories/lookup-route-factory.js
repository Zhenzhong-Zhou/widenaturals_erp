/**
 * @file lookup-route-factory.js
 * @description Factories for building and registering standardized lookup routes.
 *
 * Provides two tightly coupled helpers:
 * - `createLookupRoute`    — assembles the full middleware pipeline into a route definition object.
 * - `registerLookupRoute`  — mounts that definition onto an Express router via `router.get`.
 *
 * Routes built here follow a consistent pipeline:
 * authorize → validate → normalizeQuery → customHandlers → controller
 */

'use strict';

const { authorize }                        = require('../../middlewares/authorize');
const createQueryNormalizationMiddleware   = require('../../middlewares/normalize-query');
const validate                             = require('../../middlewares/validate');

/**
 * @typedef {import('express').Router}         Router
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * A fully assembled route definition — path + ordered middleware pipeline.
 * Not yet registered to Express; pass to `registerLookupRoute` to mount it.
 *
 * @typedef {object} LookupRoute
 * @property {string}           path     - Express path string (e.g. '/skus').
 * @property {RequestHandler[]} handlers - Ordered middleware + controller array.
 */

/**
 * Optional configuration for `createLookupRoute`.
 * All fields have sensible defaults for a standard keyword-based lookup.
 *
 * @typedef {object} LookupRouteConfig
 * @property {string[]}          [arrayKeys=[]]          - Query keys whose values should be normalized to arrays.
 * @property {string[]}          [booleanKeys=[]]         - Query keys whose values should be coerced to booleans (filters).
 * @property {string[] | object} [filterKeysOrSchema]     - Whitelist of filter keys or a Joi schema for filter validation.
 * @property {string[]}          [filterKeys=['keyword']] - Whitelisted plain filter keys passed to the service.
 * @property {boolean}           [includePagination=true] - Whether to include limit/offset in normalizedQuery.
 * @property {boolean}           [includeSorting=false]   - Whether to include sortBy/sortOrder in normalizedQuery.
 * @property {string[]}          [optionBooleanKeys=[]]   - Query keys coerced to booleans and placed in `options`.
 * @property {string[]}          [optionStringKeys=[]]   - Query keys kept as strings and placed in `options`.
 * @property {'page' | 'offset'} [paginationMode='offset']- Pagination mode passed to the query normalization middleware.
 * @property {RequestHandler[]}  [customHandlers=[]]      - Extra middleware inserted between normalization and controller.
 */

/**
 * Builds a standardized middleware pipeline for a lookup (read-only, paginated) endpoint.
 *
 * ------------------------------------------------------------------
 * Middleware pipeline (execution order)
 * ------------------------------------------------------------------
 *  1. authorize        — permission enforcement (ACL)
 *  2. validate         — Joi schema coercion + validation
 *  3. normalizeQuery   — structures validated query into filters, options, pagination
 *  4. customHandlers   — optional extension point (e.g. rate limiting, feature flags)
 *  5. controller       — business logic + response formatting
 * ------------------------------------------------------------------
 *
 * Throws at **boot time** (not per-request) if required arguments are missing
 * or invalid — fail-fast so misconfiguration is caught on startup.
 *
 * @param {object}            options
 * @param {string}            options.path        - Express route path (e.g. '/skus').
 * @param {string[]}          options.permission  - One or more permission keys required to access this route.
 * @param {object}            options.schema      - Joi schema used to validate the query string.
 * @param {RequestHandler}    options.controller  - Final request handler; receives `req.normalizedQuery`.
 * @param {LookupRouteConfig} [options.config={}] - Optional pipeline configuration.
 *
 * @returns {LookupRoute} Route definition object — pass to `registerLookupRoute` to mount.
 *
 * @throws {Error} If `path` is missing.
 * @throws {Error} If `permission` is not a non-empty array.
 * @throws {Error} If `schema` is missing.
 * @throws {Error} If `controller` is not a function.
 *
 * @example
 * const skuLookupRoute = createLookupRoute({
 *   path:       '/skus',
 *   permission: [PERMISSIONS.VIEW_SKU],
 *   schema:     skuLookupQuerySchema,
 *   controller: getSkuLookupController,
 *   config: {
 *     filterKeys:       ['keyword'],
 *     optionBooleanKeys: ['includeBarcode'],
 *   },
 * });
 */
const createLookupRoute = ({
                             path,
                             permission,
                             schema,
                             controller,
                             config = {},
                           }) => {
  // ---------------------------------------------------------
  // Fail fast — catch misconfiguration at startup, not per request.
  // These are programmer errors, not operational errors.
  // ---------------------------------------------------------
  if (!path) {
    throw new Error('[createLookupRoute] path is required');
  }
  
  if (!Array.isArray(permission) || permission.length === 0) {
    throw new Error('[createLookupRoute] permission must be a non-empty array');
  }
  
  if (!schema) {
    throw new Error('[createLookupRoute] schema is required');
  }
  
  if (typeof controller !== 'function') {
    throw new Error('[createLookupRoute] controller must be a function');
  }
  
  // ---------------------------------------------------------
  // Apply config defaults.
  // All keys are optional — callers only need to override what differs
  // from a standard keyword lookup with pagination.
  // ---------------------------------------------------------
  const {
    arrayKeys        = [],
    booleanKeys      = [],
    filterKeysOrSchema       = [],
    includePagination = true,
    includeSorting   = false,
    optionBooleanKeys = [],
    optionStringKeys       = [],
    customHandlers   = [],
    paginationMode     = 'offset',
  } = config;
  
  // ---------------------------------------------------------
  // Assemble the middleware pipeline in execution order.
  // See JSDoc above for the full pipeline description.
  // ---------------------------------------------------------
  const handlers = [
    authorize(permission),
    
    validate(
      schema,
      'query',
      { abortEarly: false, convert: true },
      'Invalid lookup query parameters.'
    ),
    
    createQueryNormalizationMiddleware(
      null,
      arrayKeys,
      booleanKeys,
      filterKeysOrSchema,
      {
        includePagination,
        includeSorting,
        paginationMode,
      },
      optionBooleanKeys,
      optionStringKeys
    ),
    
    // Caller-supplied middleware (e.g. rate limiting, feature flags).
    // Runs after normalization so handlers have access to req.normalizedQuery.
    ...customHandlers,
    
    controller,
  ];
  
  return { path, handlers };
};

/**
 * Constructs a lookup route pipeline and registers it on the given Express router.
 *
 * Internally calls `createLookupRoute` to assemble the middleware chain, then
 * mounts it as a GET handler. Throws at startup if required options are invalid —
 * see `createLookupRoute` for validation rules.
 *
 * @param {Router} router          - Express router to mount the route on.
 * @param {object} options         - Route definition. Passed directly to `createLookupRoute`.
 * @param {string}            options.path        - Express route path (e.g. '/skus').
 * @param {string[]}          options.permission  - Required permission keys.
 * @param {object}            options.schema      - Joi schema for query validation.
 * @param {RequestHandler}    options.controller  - Final request handler.
 * @param {LookupRouteConfig} [options.config={}] - Optional pipeline overrides.
 *
 * @returns {void} Mutates `router` by registering a GET handler at `options.path`.
 *
 * @example
 * registerLookupRoute(router, {
 *   path:       '/skus',
 *   permission: [PERMISSIONS.VIEW_SKU],
 *   schema:     skuLookupQuerySchema,
 *   controller: getSkuLookupController,
 *   config: {
 *     filterKeys:        ['keyword'],
 *     optionBooleanKeys: ['includeBarcode'],
 *   },
 * });
 */
const registerLookupRoute = (router, options) => {
  const route = createLookupRoute(options);
  router.get(route.path, ...route.handlers);
};

module.exports = {
  createLookupRoute,
  registerLookupRoute,
};
