/**
 * @file csrfSelector.js
 * @description Contains selectors for accessing CSRF token state in the Redux store.
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store.js';

/**
 * Selector to get the entire CSRF state.
 *
 * @param {RootState} state - The Redux store state.
 * @returns {object} - The CSRF state.
 */
export const selectCsrfState = (state: RootState) => state.csrf;

/**
 * Selector to get the CSRF token.
 *
 * @returns {string | null} - The CSRF token.
 */
export const selectCsrfToken = createSelector(
  selectCsrfState,
  (csrf) => csrf.token
);

/**
 * Selector to get the CSRF loading status.
 *
 * @returns {string} - The loading status (`idle`, `loading`, `succeeded`, or `failed`).
 */
export const selectCsrfStatus = createSelector(
  selectCsrfState,
  (csrf) => csrf.status
);

/**
 * Selector to get any error related to CSRF operations.
 *
 * @returns {string | null} - The error message, if any.
 */
export const selectCsrfError = createSelector(
  selectCsrfState,
  (csrf) => csrf.error
);
