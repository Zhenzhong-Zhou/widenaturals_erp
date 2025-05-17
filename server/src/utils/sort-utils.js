const { FILTERABLE_FIELDS } = require('./filter-field-mapping');
const { logSystemWarn } = require('./system-logger');

/**
 * Sanitize and map frontend sort keys to SQL column names.
 *
 * @param {string} sortByRaw - e.g. "name,created_at"
 * @param {string|null} module - e.g. "skuProductCards"; can be null
 * @returns {string} - Safe SQL ORDER BY clause, e.g. "p.name, p.created_at"
 */
const sanitizeSortBy = (sortByRaw = '', module = null) => {
  const map = module && FILTERABLE_FIELDS[module] ? FILTERABLE_FIELDS[module] : {};
  
  const requestedKeys = sortByRaw.split(',').map((key) => key.trim());
  const mappedKeys = requestedKeys
    .map((key) => {
      const mapped = map[key];
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
  
  // If nothing valid is mapped, fallback safely
  return mapped || map.createdAt || 'created_at';
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
  sanitizeSortBy,
  sanitizeSortOrder
};
