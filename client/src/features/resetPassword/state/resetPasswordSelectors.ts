import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { ResetPasswordState } from '@features/resetPassword/state/resetPasswordSlice';

/**
 * Base selector for resetPassword state with type assertion.
 */
const selectResetPasswordState = (state: RootState): ResetPasswordState =>
  state.resetPassword as ResetPasswordState;

/**
 * Selects the reset password error message.
 */
export const selectResetPasswordError = createSelector(
  selectResetPasswordState,
  (state) => state.error
);

/**
 * Selects detailed field-level reset password errors.
 */
export const selectResetPasswordDetails = createSelector(
  selectResetPasswordState,
  (state) => state.details
);

/**
 * Fallback wrapper for the error message.
 */
export const selectResetPasswordErrorMessage = createSelector(
  selectResetPasswordError,
  (error) => error || null
);

/**
 * Fallback wrapper for the detailed field errors.
 */
export const selectResetPasswordFieldErrors = createSelector(
  selectResetPasswordDetails,
  (details) => details || []
);
