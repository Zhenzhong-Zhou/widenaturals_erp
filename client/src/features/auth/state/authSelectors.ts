import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Selectors
export const selectAuthState = (state: RootState) => state.auth;

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (auth) => auth.isAuthenticated
);

export const selectUser = createSelector(selectAuthState, (auth) => auth.user);

export const selectTokens = createSelector(selectAuthState, (auth) => auth.tokens);
