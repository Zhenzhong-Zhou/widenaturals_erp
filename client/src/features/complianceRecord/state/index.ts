import paginatedComplianceRecordsReducer from './paginatedComplianceRecordSlice';

export const complianceReducers = {
  paginatedComplianceRecords: paginatedComplianceRecordsReducer,
};

// Optionally export thunks, selectors, types
export * from './paginatedComplianceRecordSelectors';
export * from './complianceRecordThunks';
export * from './complianceRecordTypes';
