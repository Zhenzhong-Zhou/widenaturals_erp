/**
 * @file date-range-utils.js
 * @description Utilities for normalizing and applying date range filters in SQL queries.
 *
 * Provides two cooperating functions:
 *  - normalizeDateRangeFilters — converts raw date strings to UTC ISO boundaries
 *  - applyDateRangeConditions  — appends parameterised >= / < conditions to a query builder
 *
 * These are pure functions with no side effects on their inputs.
 * No DB access, no logging, no error handling — callers own that layer.
 *
 * Exports:
 *  - normalizeDateRangeFilters
 *  - applyDateRangeConditions
 */

'use strict';

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if value can be parsed as a valid date.
 *
 * @param {*} value
 * @returns {boolean}
 */
const _isValidDate = (value) => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

/**
 * Returns a Date representing midnight UTC on the given date string.
 *
 * @param {string} date - ISO date string (e.g. '2024-01-15').
 * @returns {Date}
 */
const _startOfDayUtc = (date) => new Date(`${date}T00:00:00.000Z`);

/**
 * Returns a Date representing midnight UTC on the day after the given date string.
 * Used to make `before` filters inclusive of the target date.
 *
 * @param {string} date - ISO date string (e.g. '2024-01-15').
 * @returns {Date}
 */
const _startOfNextDayUtc = (date) => {
  const d = _startOfDayUtc(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
};

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Normalizes raw date filters into UTC ISO boundaries for SQL comparison.
 *
 * Accepts both plain date strings (e.g. '2024-01-15') and Date objects —
 * Joi's date() type coerces string inputs to Date objects before they reach
 * this function, so both forms are handled transparently.
 *
 * `afterKey`  → snapped to start of day UTC (00:00:00.000Z) for >= comparison.
 * `beforeKey` → snapped to start of next day UTC for exclusive < comparison,
 *               making the filter inclusive of the target date.
 *
 * Does not mutate the original filters object.
 *
 * @param {Object}        filters   - Raw filter object from the request.
 * @param {string}        afterKey  - Key representing the lower date bound (e.g. 'createdAfter').
 * @param {string}        beforeKey - Key representing the upper date bound (e.g. 'createdBefore').
 *
 * @returns {Object} New filter object with normalized UTC ISO date strings.
 */
const normalizeDateRangeFilters = (filters, afterKey, beforeKey) => {
  const out = { ...filters };

  // Coerce Date objects to ISO date strings — Joi date() type auto-coerces
  // string inputs to Date objects before they reach this function.
  if (out[afterKey] instanceof Date)
    out[afterKey] = out[afterKey].toISOString().slice(0, 10);
  if (out[beforeKey] instanceof Date)
    out[beforeKey] = out[beforeKey].toISOString().slice(0, 10);

  if (out[afterKey] && _isValidDate(out[afterKey])) {
    out[afterKey] = _startOfDayUtc(out[afterKey]).toISOString();
  }

  if (out[beforeKey] && _isValidDate(out[beforeKey])) {
    out[beforeKey] = _startOfNextDayUtc(out[beforeKey]).toISOString();
  }

  return out;
};

/**
 * Appends parameterised date range conditions to a SQL query builder.
 *
 * Mutates `conditions` and `params` in place — designed to be called
 * as part of a filter-building loop alongside other condition appliers.
 *
 * `paramIndexRef` is passed as an object reference rather than a plain number
 * so that the index stays in sync across multiple calls in the same builder
 * without needing a return value.
 *
 * @param {Object}   options
 * @param {string[]} options.conditions    - Accumulator array of SQL condition strings.
 * @param {Array}    options.params        - Accumulator array of bound parameter values.
 * @param {string}   options.column        - Fully qualified DB column (e.g. 'a.created_at').
 * @param {string}   [options.after]       - Normalized ISO string for lower bound (>=).
 * @param {string}   [options.before]      - Normalized ISO string for upper bound (<).
 * @param {{ value: number }} options.paramIndexRef - Mutable ref tracking the current $N index.
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
