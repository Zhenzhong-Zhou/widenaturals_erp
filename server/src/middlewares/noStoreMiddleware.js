/**
 * Middleware: Disable response caching.
 *
 * Purpose:
 * - Prevent browsers, proxies, and CDNs from caching responses
 * - Ensure system endpoints always reflect real-time state
 *
 * Usage:
 * - Public system endpoints (health, welcome)
 * - Auth/session/bootstrap endpoints
 *
 * Notes:
 * - Safe for GET requests
 * - Does not interfere with response bodies
 */
const noStoreMiddleware = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store', // for some CDNs (e.g. Fastly)
  });

  next();
};

module.exports = noStoreMiddleware;
