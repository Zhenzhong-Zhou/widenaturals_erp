/**
 * @file request-types.js
 * @description JSDoc typedef definitions for custom properties attached to
 * the Express request object by middleware (auth, traceId, query normalizer).
 */

'use strict';

/**
 * @typedef {import('express').Request & {
 *   traceId?:         string,
 *   auth?:            AuthContext,
 *   normalizedQuery?: NormalizedQuery,
 * }} AppRequest
 */

/**
 * @typedef {{
 *   page?:      number | string,
 *   limit?:     number | string,
 *   sortBy?:    string,
 *   sortOrder?: string,
 *   filters?:   Record<string, unknown>,
 * }} NormalizedQuery
 */

/**
 * @typedef {function(
 *   AppRequest,
 *   import('express').Response,
 *   import('express').NextFunction
 * ): (Promise<void>|void)} AppRequestHandler
 */
