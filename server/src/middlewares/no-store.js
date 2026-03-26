/**
 * @file no-store.js
 * @description Middleware that disables response caching for sensitive endpoints.
 *
 * Use on:
 *   - Auth and session endpoints (login, refresh, logout, bootstrap)
 *   - Public system endpoints (health, welcome)
 *   - Any endpoint whose response must always reflect real-time state
 */

'use strict';

/**
 * Sets response headers that prevent browsers, proxies, and CDNs from
 * caching the response.
 *
 * `Cache-Control: no-store` is the authoritative HTTP/1.1 directive.
 * `Pragma` and `Expires` are HTTP/1.0 legacy headers included for
 * backwards compatibility with older proxies and intermediaries.
 * `Surrogate-Control` is a CDN-specific extension (e.g. Fastly, Varnish)
 * that some providers honour in addition to `Cache-Control`.
 *
 * Safe for all HTTP methods. Does not affect response bodies.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const noStore = (req, res, next) => {
  res.set({
    'Cache-Control':    'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Surrogate-Control': 'no-store',  // CDN-level cache bypass (Fastly, Varnish)
    'Pragma':           'no-cache',   // HTTP/1.0 backwards compatibility
    'Expires':          '0',          // HTTP/1.0 backwards compatibility
  });
  
  next();
};

module.exports = noStore;
