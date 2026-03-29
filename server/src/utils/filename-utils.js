/**
 * @file filename-utils.js
 * @description
 * Filename generation utilities.
 *
 * Provides helpers for constructing deterministic, timestamped
 * filenames for file exports and downloads.
 */

'use strict';

const { format } = require('date-fns-tz');

/**
 * Appends a timestamp to a base filename.
 *
 * The base name should be provided without an extension — the caller
 * is responsible for appending the appropriate extension afterward.
 * Example: 'pricing_export' → 'pricing_export_20250515_213045'
 *
 * @param {string} baseName - Base filename without extension
 * @param {string} [timeZone='America/Los_Angeles'] - IANA timezone for timestamp
 * @returns {string} Timestamped filename without extension
 */
const generateTimestampedFilename = (
  baseName,
  timeZone = 'America/Los_Angeles'
) => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss', { timeZone });
  return `${baseName}_${timestamp}`;
};

module.exports = {
  generateTimestampedFilename,
};
