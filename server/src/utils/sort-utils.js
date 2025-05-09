const { FILTERABLE_FIELDS } = require('./filter-field-mapping');

/**
 * Sanitize and map frontend sort keys to SQL column names.
 *
 * @param {string} sortByRaw - e.g. "name,created_at"
 * @param {string|null} module - e.g. "skuProductCards"; can be null
 * @returns {string} - Safe SQL ORDER BY clause, e.g. "p.name, p.created_at"
 */
const sanitizeSortBy = (sortByRaw = '', module = null) => {
  const map = module && FILTERABLE_FIELDS[module] ? FILTERABLE_FIELDS[module] : {};
  
  const mapped = sortByRaw
    .split(',')
    .map((key) => map[key.trim()])
    .filter(Boolean)
    .join(', ');
  
  // If nothing valid is mapped, fallback safely
  return mapped || Object.values(map)[0] || 'created_at';
};

module.exports = {
  sanitizeSortBy
};
