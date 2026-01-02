import paginatedComplianceRecordsReducer from './paginatedComplianceRecordsSlice';

/**
 * Reducer map for the Compliance Record feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `complianceRecord` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for the Compliance Record feature.
 */
export const complianceRecordReducers = {
  /** Paginated compliance records, filters, and pagination metadata */
  paginatedComplianceRecords: paginatedComplianceRecordsReducer,
};
