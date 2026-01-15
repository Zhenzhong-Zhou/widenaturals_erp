/**
 * @file csrfSelectors.ts
 * @description Selectors for CSRF infrastructure state.
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the CSRF state slice.
 *
 * Responsibilities:
 * - Extract the CSRF infrastructure state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectCsrfState = (state: RootState) =>
  selectRuntime(state).csrf;

/**
 * Selects the current CSRF token value.
 */
export const selectCsrfToken = createSelector(
  [selectCsrfState],
  (csrf) => csrf.token
);

/**
 * Selects the current CSRF lifecycle status.
 *
 * Typically reflects states such as:
 * - idle
 * - loading
 * - ready
 * - error
 */
export const selectCsrfStatus = createSelector(
  [selectCsrfState],
  (csrf) => csrf.status
);

/**
 * Selects any CSRF-related error message.
 */
export const selectCsrfError = createSelector(
  [selectCsrfState],
  (csrf) => csrf.error
);
