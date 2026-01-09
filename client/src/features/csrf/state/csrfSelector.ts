/**
 * @file csrfSelectors.ts
 * @description Selectors for CSRF infrastructure state.
 */

import { selectRuntime } from '@store/selectors';
import { createSelector } from '@reduxjs/toolkit';

/**
 * Selects the CSRF slice state.
 */
const selectCsrfState = createSelector(
  [selectRuntime],
  (runtime) => runtime.csrf
);

/**
 * Selects the current CSRF token.
 */
export const selectCsrfToken = createSelector(
  selectCsrfState,
  (csrf) => csrf.token
);

/**
 * Selects the CSRF lifecycle status.
 */
export const selectCsrfStatus = createSelector(
  selectCsrfState,
  (csrf) => csrf.status
);

/**
 * Selects the CSRF error message, if any.
 */
export const selectCsrfError = createSelector(
  selectCsrfState,
  (csrf) => csrf.error
);
