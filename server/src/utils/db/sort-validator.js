const AppError = require('../AppError');

/**
 * Validates sorting configuration for paginated queries.
 *
 * This helper enforces safe and deterministic sorting behavior by ensuring:
 *
 * 1. Mutual exclusivity between:
 *    - rawOrderBy (trusted SQL fragment)
 *    - dynamic sorting (sortBy / additionalSorts)
 *
 * 2. Dynamic sorting requires a whitelistSet to prevent SQL injection
 *
 * --------------------------------------------------
 * Sorting modes
 * --------------------------------------------------
 *
 * - Raw sorting:
 *   Uses a predefined SQL ORDER BY clause (rawOrderBy).
 *   Intended for complex queries (aggregates, computed fields).
 *
 * - Dynamic sorting:
 *   Uses user-provided sortBy / additionalSorts.
 *   MUST be validated against whitelistSet.
 *
 * --------------------------------------------------
 * Behavior
 * --------------------------------------------------
 *
 * - Throws AppError if:
 *   - rawOrderBy is used together with dynamic sorting
 *   - whitelistSet is missing or invalid for dynamic sorting
 *   - additionalSorts is not an array
 *
 * - No return value (throws on failure, silent on success)
 *
 * --------------------------------------------------
 * @param {Object} options
 * @param {string} [options.sortBy] - Primary sort field (API-level field)
 * @param {Array<string>} [options.additionalSorts=[]] - Secondary sort fields
 * @param {string} [options.rawOrderBy] - Raw SQL ORDER BY clause
 * @param {Set<string>} [options.whitelistSet] - Allowed SQL sort expressions
 * @param {string} options.context - Context for logging/error tracing
 *
 * @throws {AppError} If validation fails
 */
const validateSortingConfig = ({
                                 sortBy,
                                 additionalSorts = [],
                                 rawOrderBy,
                                 whitelistSet,
                                 context,
                               }) => {
  //--------------------------------------------------
  // Validate inputs (defensive layer)
  //--------------------------------------------------
  if (!context || typeof context !== 'string') {
    throw AppError.validationError('Invalid context for sorting validation');
  }
  
  if (!Array.isArray(additionalSorts)) {
    throw AppError.validationError(
      'additionalSorts must be an array',
      { context }
    );
  }
  
  //--------------------------------------------------
  // Mutually exclusive sorting modes
  //--------------------------------------------------
  const hasDynamicSort =
    Boolean(sortBy) || additionalSorts.length > 0;
  
  if (rawOrderBy && hasDynamicSort) {
    throw AppError.validationError(
      'Cannot use rawOrderBy with dynamic sorting',
      { context }
    );
  }
  
  //--------------------------------------------------
  // Dynamic sorting requires whitelist
  //--------------------------------------------------
  if (hasDynamicSort) {
    if (!(whitelistSet instanceof Set) || whitelistSet.size === 0) {
      throw AppError.validationError(
        'whitelistSet is required for dynamic sorting',
        { context }
      );
    }
  }
};

module.exports = {
  validateSortingConfig,
};
