import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

export const selectResetPasswordError = (state: RootState) => state.resetPassword.error;
export const selectResetPasswordDetails = (state: RootState) => state.resetPassword.details;

export const selectResetPasswordErrorMessage = createSelector(
  [selectResetPasswordError],
  (error) => error || null
);

export const selectResetPasswordFieldErrors = createSelector(
  [selectResetPasswordDetails],
  (details) => details || []
);
