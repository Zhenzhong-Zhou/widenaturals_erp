/**
 * @file sort-utils.js
 * @description Resolves and sanitizes client-facing sortBy keys to SQL column names.
 *
 * Sits between the HTTP layer (query-normalizers.js) and the SQL layer (sql-ident.js):
 * it trusts that values have been comma-split and trimmed upstream, and produces
 * SQL-safe column strings that the query builder can use directly.
 *
 * Depends on:
 *  - normalizeParamArray (query-normalizers.js) — splits and trims raw sortBy strings
 *  - SORTABLE_FIELDS     — registry of per-module sortBy → SQL column maps
 *
 * Note: Sort direction is not handled here. Import normalizeSortOrder directly
 * from query-normalizers.js at the call site.
 */

const { normalizeParamArray } = require('./query-normalizers');
const { SORTABLE_FIELDS } = require('./sort-field-mapping');
const { logSystemWarn } = require('./logging/system-logger');

/**
 * Retrieves the sort field mapping object for a given module key.
 *
 * @param {string} moduleKey - Key into SORTABLE_FIELDS (e.g., 'inventoryActivityLogSortMap').
 * @returns {Record<string, string>} Mapping of sortBy keys to SQL column names, or {}.
 */
const getSortMapForModule = (moduleKey) => {
  return SORTABLE_FIELDS[moduleKey] || {};
};

/**
 * Resolves and sanitizes frontend sortBy keys to a SQL-safe column string.
 *
 * Uses normalizeParamArray to split and clean the raw input, then maps each key
 * against the module's SORTABLE_FIELDS entry. Unrecognized keys are warned and dropped.
 * Falls back to 'createdAt' or the first available mapped column if nothing resolves.
 *
 * Sort direction is intentionally not handled here — callers should use
 * normalizeSortOrder() from query-normalizers.js separately.
 *
 * @param {string} [sortByRaw='']   - Raw sortBy string from req.query (e.g. "productName,actionTimestamp").
 * @param {string|null} [module=null] - Module key for SORTABLE_FIELDS lookup.
 * @returns {string} Comma-separated SQL column string (e.g. "p.name, ial.action_timestamp").
 */
const sanitizeSortBy = (sortByRaw = '', module = null) => {
  const sortMap = getSortMapForModule(module);
  
  // Reuse normalizeParamArray instead of re-implementing split/trim/filter
  const requestedKeys = normalizeParamArray(sortByRaw) ?? [];
  
  const mappedColumns = requestedKeys
    .map((key) => {
      const column = sortMap[key];
      if (!column) {
        logSystemWarn(`Invalid or unmapped sortBy key: "${key}"`, {
          context: 'sanitizeSortBy',
          module,
        });
      }
      return column;
    })
    .filter(Boolean);
  
  return (
    mappedColumns.join(', ') ||
    sortMap['createdAt'] ||
    Object.values(sortMap)[0]
  );
};

module.exports = {
  getSortMapForModule,
  sanitizeSortBy,
};
