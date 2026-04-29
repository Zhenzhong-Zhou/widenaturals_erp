/**
 * @file export-header-utils.js
 * @description
 * String formatting utilities for export header processing.
 *
 * Provides header formatting, UUID/id field filtering, and column map
 * generation for use by export pipeline functions (CSV, PDF, XLSX, TXT).
 */

'use strict';

const { isUUID } = require('./id-utils');

/**
 * Converts an object key into a human-readable column header.
 *
 * Splits on underscores and capitalizes the first letter of each word.
 * Example: 'created_at' → 'Created At'
 *
 * @param {string} key - Raw object key
 * @returns {string} Formatted header string
 */
const formatHeader = (key) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Derives formatted column headers and a header-to-key map from a data array.
 *
 * Strips fields where the value is a UUID or the key is literally 'id'.
 * The returned columnMap allows export functions to look up the original
 * object key from a formatted header string.
 *
 * @param {Array<Object>} data - Non-empty array of uniform objects
 * @returns {{ formattedHeaders: string[], columnMap: Object.<string, string> }}
 * @throws {Error} If data is not a non-empty array
 */
const processHeaders = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('processHeaders requires a non-empty array');
  }

  const columnMap = Object.keys(data[0])
    .filter((key) => key !== 'id' && !isUUID(data[0][key]))
    .reduce((acc, key) => {
      acc[formatHeader(key)] = key;
      return acc;
    }, {});

  return {
    formattedHeaders: Object.keys(columnMap),
    columnMap,
  };
};

module.exports = {
  formatHeader,
  processHeaders,
};
