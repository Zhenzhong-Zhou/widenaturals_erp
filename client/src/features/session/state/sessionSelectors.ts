import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Base Selector: Select the session state from the RootState
export const selectSessionState = (state: RootState) => state.session;

// Memoized Selectors

// Selector: Check if the user is authenticated
export const selectIsAuthenticated = createSelector(
  selectSessionState,
  (session) => session?.isAuthenticated ?? false
);

// Selector: Retrieve the access token
export const selectAccessToken = createSelector(
  selectSessionState,
  (session) => session?.accessToken ?? null
);

// Selector: Retrieve the user information
export const selectUser = createSelector(
  selectSessionState,
  (session) => session?.user ?? null
);

// Selector: Retrieve the last login timestamp
export const selectLastLogin = createSelector(
  selectSessionState,
  (session) => session?.lastLogin ?? null
);

// Selector: Retrieve the current message
export const selectMessage = createSelector(
  selectSessionState,
  (session) => session?.message ?? ''
);

// Selector: Retrieve the current login error
export const selectLoginError = createSelector(
  selectSessionState,
  (session) => session?.loginError ?? null
);

// Selector: Retrieve the loading state
export const selectLoading = createSelector(
  selectSessionState,
  (session) => session?.loading ?? false
);
