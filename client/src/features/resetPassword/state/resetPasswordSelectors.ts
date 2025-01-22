import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

export const selectResetPasswordError = (state: RootState) => state.resetPassword.error;
export const selectResetPasswordErrorMessage = createSelector(
  [selectResetPasswordError],
  (error) => error?.message || null // Derived data
);
export const selectResetPasswordLoading = (state: RootState) => state.resetPassword.loading;
export const selectResetPasswordSuccess = (state: RootState) => state.resetPassword.success;
