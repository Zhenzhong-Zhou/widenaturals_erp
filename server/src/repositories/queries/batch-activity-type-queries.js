/**
 * @file batch-activity-type-queries.js
 * @description SQL query constants for batch-activity-type-repository.js.
 *
 * Exports:
 *  - BATCH_ACTIVITY_TYPE_SELECT — fetches all active batch activity type records
 */

'use strict';

// Fetches only active types — inactive types are retired lifecycle codes
// that should no longer appear in batch processing flows.
const BATCH_ACTIVITY_TYPE_SELECT = `
  SELECT id, code
  FROM batch_activity_types
  WHERE is_active = TRUE
`;

module.exports = {
  BATCH_ACTIVITY_TYPE_SELECT,
};
