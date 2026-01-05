import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { LoginResponseData } from '@features/session';

/**
 * Base selector — retrieves the full `login` slice.
 */
const selectLoginState = (state: RootState) => state.login;

/**
 * Selector: returns the login response data or null.
 */
export const selectLoginData = createSelector(
  [selectLoginState],
  (state): LoginResponseData | null => state.data
);

/**
 * Selector: indicates whether a login request is in progress.
 */
export const selectLoginLoading = createSelector(
  [selectLoginState],
  (state) => state.loading
);

/**
 * Selector: returns the current login error message (if any).
 */
export const selectLoginError = createSelector(
  [selectLoginState],
  (state) => state.error
);

/**
 * Derived selector: returns `true` if the user is authenticated.
 */
export const selectIsAuthenticated = createSelector(
  [selectLoginData],
  (data) => Boolean(data)
);

/**
 * Selector: returns the last login timestamp (if available).
 */
export const selectLastLogin = createSelector(
  [selectLoginData],
  (data) => data?.lastLogin ?? null
);

/* =========================================================
 * AUTH TOKEN SELECTORS (NEW — REQUIRED FOR AXIOS)
 * ======================================================= */

/**
 * Selector: returns the current access token or null.
 *
 * This is the single source of truth for authenticated requests.
 */
export const selectAccessToken = createSelector(
  [selectLoginData],
  (data) => data?.accessToken ?? null
);

/**
 * Selector: returns the current CSRF token or null.
 */
export const selectCsrfToken = createSelector(
  [selectLoginData],
  (data) => data?.csrfToken ?? null
);
