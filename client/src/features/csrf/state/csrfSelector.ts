/**
 * @file csrfSelector.ts
 * @description Contains selectors for accessing CSRF token state in the Redux store.
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/store.ts'; // Use the typed RootState from storeHooks

/**
 * Selector to get the entire CSRF state.
 *
 * @param state - The Redux store state.
 * @returns The CSRF state.
 */
export const selectCsrfState = (state: RootState) => state.csrf;

/**
 * Selector to get the CSRF token.
 *
 * @returns The CSRF token or `null` if unavailable.
 */
export const selectCsrfToken = createSelector(
  selectCsrfState,
  (csrf) => csrf.token || null // Default to null if token is undefined
);

/**
 * Selector to get the CSRF loading status.
 *
 * @returns The loading status (`idle`, `loading`, `succeeded`, or `failed`).
 */
export const selectCsrfStatus = createSelector(
  selectCsrfState,
  (csrf) => csrf.status || 'idle' // Default to 'idle' if status is undefined
);

/**
 * Selector to get any error related to CSRF operations.
 *
 * @returns The error message or `null` if no error exists.
 */
export const selectCsrfError = createSelector(
  selectCsrfState,
  (csrf) => csrf.error || null // Default to null if error is undefined
);
