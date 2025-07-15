const { SORTABLE_FIELDS } = require('./sort-field-mapping');
const { logSystemWarn } = require('./system-logger');

/**
 * Retrieves the sort field mapping object for a given module key.
 *
 * Used to resolve client-facing sortBy keys (e.g., 'productName') to their corresponding
 * database column names (e.g., 'p.name') in a safe and reusable way.
 *
 * If the module key is not found in the registry, returns an empty object.
 *
 * @param {string} moduleKey - The name of the module's sort map (e.g., 'inventoryActivityLogSortMap')
 * @returns {Record<string, string>} A mapping of sortBy keys to SQL columns or an empty object
 */
const getSortMapForModule = (moduleKey) => {
  return SORTABLE_FIELDS[moduleKey] || {};
};

/**
 * Sanitizes and maps frontend-provided `sortBy` keys to SQL-safe column names using the module's sort map.
 *
 * - Accepts comma-separated values (e.g., "productName,actionTimestamp")
 * - Trims and resolves each key via the given module's `SORTABLE_FIELDS` map
 * - Logs a warning for any unmapped or invalid keys
 * - Joins all valid mapped columns into a comma-separated SQL string
 * - Falls back to 'created_at' or the first available mapped column if none are valid
 *
 * @param {string} [sortByRaw=''] - Raw sortBy string from query parameters
 * @param {string|null} [module=null] - Module key for the corresponding entry in `SORTABLE_FIELDS`
 * @returns {string} - Sanitized SQL sort string (e.g., "p.name, ial.action_timestamp")
 */
const sanitizeSortBy = (sortByRaw = '', module = null) => {
  const sortMap = getSortMapForModule(module);
  
  const requestedKeys = sortByRaw
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  
  const mappedKeys = requestedKeys
    .map((key) => {
      const mapped = sortMap[key];
      if (!mapped) {
        logSystemWarn(`Invalid or ambiguous sortBy key: "${key}"`, {
          context: 'sanitizeSortBy',
          module,
        });
      }
      return mapped;
    })
    .filter(Boolean);
  
  const mapped = mappedKeys.join(', ');
  
  // Fallback: 'createdAt' or first defined key in the map
  return mapped || sortMap['createdAt'] || Object.values(sortMap)[0];
};

/**
 * Ensures the sort order is valid ('ASC' or 'DESC').
 * Falls back to 'ASC' by default.
 *
 * @param {string} sortOrderRaw
 * @returns {'ASC' | 'DESC'}
 */
const sanitizeSortOrder = (sortOrderRaw = '') => {
  const upper = sortOrderRaw.trim().toUpperCase();
  return upper === 'DESC' ? 'DESC' : 'ASC';
};

module.exports = {
  getSortMapForModule,
  sanitizeSortBy,
  sanitizeSortOrder,
};
