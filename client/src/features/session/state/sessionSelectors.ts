import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Base Selector: Select the session state from the RootState
export const selectSessionState = (state: RootState) => state.session;

// Selector: Check if the user is authenticated (memoized)
export const selectIsAuthenticated = createSelector(
  selectSessionState,
  (session) => session.isAuthenticated
);

// Selector: Retrieve the access token (memoized)
export const selectAccessToken = createSelector(
  selectSessionState,
  (session) => session.accessToken
);

// Selector: Retrieve the user information (memoized)
export const selectUser = createSelector(
  selectSessionState,
  (session) => session.user
);

// Selector: Retrieve the last login timestamp (memoized)
export const selectLastLogin = createSelector(
  selectSessionState,
  (session) => session.lastLogin
);

// Selector: Retrieve the current message (memoized)
export const selectMessage = createSelector(
  selectSessionState,
  (session) => session.message
);

// Selector: Retrieve the current login error (memoized)
export const selectLoginError = createSelector(
  selectSessionState,
  (session) => session.loginError
);

// Selector: Retrieve the loading state (memoized)
export const selectLoading = createSelector(
  selectSessionState,
  (session) => session.loading
);
