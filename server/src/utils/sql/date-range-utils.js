/**
 * Check whether a value can be safely interpreted as a valid date string.
 *
 * Intended for date-only strings (YYYY-MM-DD).
 *
 * @param {string} value
 * @returns {boolean}
 */
const isValidDate = (value) => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

/**
 * Convert a date string (YYYY-MM-DD) to the start of that day in UTC.
 *
 * Example:
 *   "2026-01-20" → "2026-01-20T00:00:00.000Z"
 *
 * @param {string} date
 * @returns {Date}
 */
const startOfDayUtc = (date) =>
  new Date(`${date}T00:00:00.000Z`);

/**
 * Convert a date string (YYYY-MM-DD) to the start of the next day in UTC.
 *
 * This is used to implement an exclusive "Before" boundary
 * using half-open date ranges: [start, end).
 *
 * Example:
 *   "2026-01-20" → "2026-01-21T00:00:00.000Z"
 *
 * @param {string} date
 * @returns {Date}
 */
const startOfNextDayUtc = (date) => {
  const d = startOfDayUtc(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
};

/**
 * Normalize date-only range filters into UTC timestamp boundaries.
 *
 * Rules:
 * - "After"  → inclusive, start of day (>=)
 * - "Before" → exclusive, start of next day (<)
 *
 * This function should be called in the service/controller layer
 * BEFORE building SQL conditions.
 *
 * @template {Record<string, any>} T
 * @param {T} filters - Incoming filter object
 * @param {keyof T} afterKey - Key representing the "after" boundary
 * @param {keyof T} beforeKey - Key representing the "before" boundary
 * @returns {T} New filter object with normalized timestamp values
 */
const normalizeDateRangeFilters = (filters, afterKey, beforeKey) => {
  const out = { ...filters };
  
  if (filters[afterKey] && isValidDate(filters[afterKey])) {
    out[afterKey] = startOfDayUtc(filters[afterKey]).toISOString();
  }
  
  if (filters[beforeKey] && isValidDate(filters[beforeKey])) {
    out[beforeKey] = startOfNextDayUtc(filters[beforeKey]).toISOString();
  }
  
  return out;
};

/**
 * Apply normalized date range conditions to a SQL WHERE clause builder.
 *
 * This function assumes the date values have already been normalized
 * using `normalizeDateRangeFilters`.
 *
 * It appends conditions using half-open range semantics:
 *   column >= after
 *   column <  before
 *
 * NOTE:
 * - `paramIndexRef` is a mutable counter object used to keep
 *   SQL placeholders ($1, $2, ...) in sync across multiple helpers.
 *
 * @param {Object} options
 * @param {string[]} options.conditions - SQL WHERE conditions array
 * @param {any[]} options.params - SQL parameter values array
 * @param {string} options.column - Fully qualified column name (e.g. "a.created_at")
 * @param {string|undefined} options.after - Normalized "after" timestamp
 * @param {string|undefined} options.before - Normalized "before" timestamp
 * @param {{ value: number }} options.paramIndexRef - Mutable parameter index reference
 */
const applyDateRangeConditions = ({
                                    conditions,
                                    params,
                                    column,
                                    after,
                                    before,
                                    paramIndexRef,
                                  }) => {
  if (after) {
    conditions.push(`${column} >= $${paramIndexRef.value}`);
    params.push(after);
    paramIndexRef.value++;
  }
  
  if (before) {
    conditions.push(`${column} < $${paramIndexRef.value}`);
    params.push(before);
    paramIndexRef.value++;
  }
};

module.exports = {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
};
