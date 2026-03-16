const { wrapAsyncHandler } = require('../../utils/wrap-async');

/**
 * Factory to create standardized lookup controllers.
 *
 * ------------------------------------------------------------------
 * Overview
 * ------------------------------------------------------------------
 * This factory generates Express controllers for lookup endpoints
 * (e.g., SKUs, suppliers, statuses, customers).
 *
 * It enforces a consistent request → service → response pipeline.
 *
 * ------------------------------------------------------------------
 * Responsibilities
 * ------------------------------------------------------------------
 * - Extract authenticated user (`req.auth.user`)
 * - Extract normalized query parameters (`req.normalizedQuery`)
 * - Invoke the provided lookup service
 * - Return a standardized API response format
 *
 * NOTE:
 * - Controllers created by this factory should NOT contain business logic.
 * - All access control, filtering, and transformation must be handled
 *   in the service layer.
 *
 * ------------------------------------------------------------------
 * Expected Service Contract
 * ------------------------------------------------------------------
 * The provided service MUST follow this signature:
 *
 *   (user, { filters, options, limit, offset }) =>
 *     Promise<{ items: Array, hasMore: boolean }>
 *
 * Where:
 * - `filters`: query filters (e.g., keyword, statusId)
 * - `options`: optional behavior flags (e.g., labelOnly, mode)
 * - `limit`: pagination limit
 * - `offset`: pagination offset
 *
 * ------------------------------------------------------------------
 * Request Requirements
 * ------------------------------------------------------------------
 * - `req.auth.user` should be populated via authentication middleware
 * - `req.normalizedQuery` should be provided via normalization middleware
 *
 * Fallback behavior is applied if missing to prevent runtime crashes.
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
 *   (user, { filters, options, limit, offset }) =>
 *     Promise<{ items: Array, hasMore: boolean }>
 *
 * @param {string} config.successMessage
 *   Message returned in successful API response
 *
 * @returns {Function} Express controller wrapped with async error handler
 */
const createLookupController = ({ service, successMessage }) => {
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
  
  const handler = async (req, res) => {
    //---------------------------------------------------------
    // Extract authenticated user
    //---------------------------------------------------------
    const user = req?.auth?.user;
    
    //---------------------------------------------------------
    // Extract normalized query (safe fallback)
    //---------------------------------------------------------
    const normalizedQuery = req.normalizedQuery || {};
    
    //---------------------------------------------------------
    // Destructure query parameters with defaults
    //---------------------------------------------------------
    const {
      filters = {},
      options = {},
      limit = 50,
      offset = 0,
    } = normalizedQuery;
    
    //---------------------------------------------------------
    // Execute lookup service
    //---------------------------------------------------------
    const result = await service(user, {
      filters,
      options,
      limit,
      offset,
    });
    
    //---------------------------------------------------------
    // Defensive fallback (protect against malformed service output)
    //---------------------------------------------------------
    const {
      items = [],
      hasMore = false,
    } = result || {};
    
    //---------------------------------------------------------
    // Return standardized response
    //---------------------------------------------------------
    return res.status(200).json({
      success: true,
      message: successMessage,
      items,
      offset,
      limit,
      hasMore,
    });
  };
  
  //---------------------------------------------------------
  // Wrap with async error handler
  //---------------------------------------------------------
  return wrapAsyncHandler(handler);
};

module.exports = {
  createLookupController,
};
