/**
 * @file validate-required-fields.js
 * @description Utility for validating required fields across bulk record payloads.
 *
 * Designed for service and repository layers when validating batch insert or
 * update payloads before they reach the database.
 */

'use strict';

const AppError = require('../AppError');
const { logWarn } = require('../logging/logger-helper');

const CONTEXT = 'utils/validate-required-fields';

// Maximum number of invalid record samples included in the log entry.
// Prevents excessive log size on large batch failures.
const MAX_SAMPLE_ERRORS = 3;

/**
 * Validates that every record in a dataset contains non-empty values for all
 * required fields. Throws a validation error on the first batch failure found.
 *
 * A field is considered missing if its value is `undefined`, `null`, or `''`.
 *
 * Performance:
 *   - O(n × m) where n = records, m = requiredFields
 *   - No allocations beyond the `invalidRecords` array (only populated on failure)
 *   - Suitable for batch validation in ERP workflows
 *
 * Security:
 *   - Throws a generic `'Invalid request.'` message to the caller so field
 *     names and record indices are never exposed in API responses.
 *   - Detailed failure information is written to logs only.
 *
 * @param {object[]} records - Array of records to validate. Must be non-empty.
 * @param {string[]} requiredFields - Field names that must be present and
 *   non-empty in every record.
 * @param {string} [context=CONTEXT] - Label used in structured log entries
 *   to identify the call site.
 * @returns {void}
 * @throws {AppError} If `records` is not a non-empty array, if `requiredFields`
 *   is not an array, or if any record is missing a required field.
 *
 * @example
 * validateRequiredFields(
 *   rows,
 *   ['sku', 'quantity', 'warehouseId'],
 *   'inventory-service/bulkInsert'
 * );
 */
const validateRequiredFields = (
  records,
  requiredFields = [],
  context = CONTEXT
) => {
  // Guard: records must be a non-empty array — anything else is a caller error.
  if (!Array.isArray(records) || records.length === 0) {
    throw AppError.validationError('Invalid request.');
  }
  
  // Guard: requiredFields must be an array — a wrong type is a programming error.
  if (!Array.isArray(requiredFields)) {
    throw new Error(
      'validateRequiredFields(): requiredFields must be an array of strings.'
    );
  }
  
  // Nothing to validate if no required fields are specified.
  if (requiredFields.length === 0) return;
  
  const invalidRecords = [];
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    // Treat non-object records (null, primitives) as entirely missing.
    if (!record || typeof record !== 'object') {
      invalidRecords.push({ index: i, missingFields: requiredFields });
      continue;
    }
    
    const missingFields = requiredFields.filter(
      (field) =>
        record[field] === undefined ||
        record[field] === null ||
        record[field] === ''
    );
    
    if (missingFields.length > 0) {
      invalidRecords.push({ index: i, missingFields });
    }
  }
  
  if (invalidRecords.length === 0) return;
  
  // Log diagnostic details internally before throwing the generic error.
  // Capped at MAX_SAMPLE_ERRORS entries to keep log payloads bounded on
  // large batch failures.
  logWarn('Required field validation failed', null, {
    context,
    requiredFields,
    invalidCount:  invalidRecords.length,
    totalRecords:  records.length,
    sampleErrors:  invalidRecords.slice(0, MAX_SAMPLE_ERRORS),
  });
  
  throw AppError.validationError('Invalid request.');
};

module.exports = {
  validateRequiredFields
};
