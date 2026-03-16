const wrapAsync = require('../../utils/wrap-async');

/**
 * Factory to create standardized lookup controllers.
 *
 * This utility enforces a consistent pattern across all lookup endpoints
 * (e.g., suppliers, batch statuses, customers, inventory).
 *
 * ------------------------------------------------------------------
 * Responsibilities
 * ------------------------------------------------------------------
 * - Extract authenticated user from request
 * - Extract normalized query parameters (filters, pagination)
 * - Invoke corresponding lookup service
 * - Return standardized API response format
 *
 * ------------------------------------------------------------------
 * Expected Service Contract
 * ------------------------------------------------------------------
 * The provided service MUST return:
 *
 * {
 *   items: Array,        // list of lookup records
 *   hasMore: boolean     // pagination flag
 * }
 *
 * ------------------------------------------------------------------
 * Request Requirements
 * ------------------------------------------------------------------
 * - req.auth.user must be populated (via auth middleware)
 * - req.normalizedQuery is expected (via normalization middleware)
 *
 * ------------------------------------------------------------------
 * Response Format
 * ------------------------------------------------------------------
 * {
 *   success: true,
 *   message: string,
 *   items: Array,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }
 *
 * ------------------------------------------------------------------
 * @param {object} config
 * @param {Function} config.service
 *   Lookup service function:
 *   (user, { filters, limit, offset }) => Promise<{ items, hasMore }>
 *
 * @param {string} config.successMessage
 *   Success message returned in API response
 *
 * @returns {Function} Express controller (wrapped with async error handler)
 */
const createLookupController = ({
                                  service,
                                  successMessage,
                                }) => {
  //---------------------------------------------------------
  // Validate factory inputs (fail fast)
  //---------------------------------------------------------
  if (typeof service !== 'function') {
    throw new Error('[createLookupController] service must be a function');
  }
  
  if (!successMessage || typeof successMessage !== 'string') {
    throw new Error(
      '[createLookupController] successMessage must be a non-empty string'
    );
  }
  
  //---------------------------------------------------------
  // Return Express controller
  //---------------------------------------------------------
  return wrapAsync(async (req, res) => {
    //---------------------------------------------------------
    // Extract authenticated user (assumes auth middleware ran)
    //---------------------------------------------------------
    const user = req?.auth?.user;
    
    //---------------------------------------------------------
    // Extract normalized query parameters
    // (fallback ensures controller won't crash if middleware missing)
    //---------------------------------------------------------
    const {
      filters = {},
      limit = 50,
      offset = 0,
    } = req.normalizedQuery || {};
    
    //---------------------------------------------------------
    // Execute lookup service
    //---------------------------------------------------------
    const result = await service(user, {
      filters,
      limit,
      offset,
    });
    
    //---------------------------------------------------------
    // Defensive fallback (protects against malformed service output)
    //---------------------------------------------------------
    const {
      items = [],
      hasMore = false,
    } = result || {};
    
    //---------------------------------------------------------
    // Send standardized API response
    //---------------------------------------------------------
    return res.status(200).json({
      success: true,
      message: successMessage,
      items,
      offset,
      limit,
      hasMore,
    });
  });
};

module.exports = {
  createLookupController,
};
