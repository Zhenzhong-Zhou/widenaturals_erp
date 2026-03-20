const AppError = require('../AppError');
const { logSystemError } = require('../logging/system-logger');

/**
 * Validate that required fields exist in each record of a dataset.
 *
 * This utility checks that all provided records contain values for the
 * specified required fields. If any record is missing required data,
 * a validation error is thrown and diagnostic information is logged.
 *
 * The function is designed for use in service or repository layers when
 * validating bulk insert or update payloads.
 *
 * Performance:
 * - Linear scan of records with field checks (O(n × m))
 * - No additional allocations beyond error tracking
 * - Suitable for batch validation in ERP workflows
 *
 * Logging:
 * - Logs validation failures with context and sample records
 * - Limits logged error samples to avoid excessive log size
 *
 * Security:
 * - Returns a generic error message to the caller
 * - Detailed validation failures are only written to logs
 *
 * @function validateRequiredFields
 *
 * @param {Array<Object>} records
 * Array of records to validate.
 *
 * @param {Array<string>} requiredFields
 * List of field names that must exist in each record.
 *
 * @param {string} [context='unknown']
 * Context identifier used for structured logging.
 *
 * @throws {AppError}
 * Throws a validation error if records are invalid or required
 * fields are missing.
 */
const validateRequiredFields = (
  records,
  requiredFields = [],
  context = 'unknown'
) => {
  // Validate input dataset
  if (!Array.isArray(records) || records.length === 0) {
    throw AppError.validationError('Invalid request.');
  }
  
  // Ensure requiredFields is a valid array
  if (!Array.isArray(requiredFields)) {
    requiredFields = [];
  }
  
  const invalidRecords = [];
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    // Defensive guard against malformed record objects
    if (!record || typeof record !== 'object') {
      invalidRecords.push({
        index: i,
        missingFields: requiredFields,
      });
      continue;
    }
    
    // Identify missing required fields
    const missingFields = requiredFields.filter(
      (field) =>
        record[field] === undefined ||
        record[field] === null ||
        record[field] === ''
    );
    
    if (missingFields.length > 0) {
      invalidRecords.push({
        index: i,
        missingFields,
      });
    }
  }
  
  if (invalidRecords.length > 0) {
    logSystemError('Required field validation failed', {
      context,
      requiredFields,
      invalidCount: invalidRecords.length,
      totalRecords: records.length,
      sampleErrors: invalidRecords.slice(0, 3), // limit log size
    });
    
    throw AppError.validationError('Invalid request.');
  }
};

module.exports = {
  validateRequiredFields,
};
