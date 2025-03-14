import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

export const selectComplianceState = (state: RootState) => state.compliances;

// ✅ Memoized selector for compliance data
export const selectCompliances = createSelector(
  [selectComplianceState],
  (complianceState) => complianceState.data
);

/**
 * Selects pagination details.
 */
export const selectCompliancesPagination = createSelector(
  [selectComplianceState],
  (complianceState) => complianceState.pagination
);

// ✅ Memoized selector for loading state
export const selectCompliancesLoading = createSelector(
  [selectComplianceState],
  (complianceState) => complianceState.loading
);

// ✅ Memoized selector for error state
export const selectCompliancesError = createSelector(
  [selectComplianceState],
  (complianceState) => complianceState.error
);
