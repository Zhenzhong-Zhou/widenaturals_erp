import { createAsyncThunk } from '@reduxjs/toolkit';
import { resetPasswordService } from '../../../services';
import { ResetPasswordError, ResetPasswordResponse } from './resetPasswordInterfaces.ts';

/**
 * Thunk for resetting the user's password using createAsyncThunk.
 *
 * @param {Object} payload - The request payload containing currentPassword and newPassword.
 * @param {string | null} payload.currentPassword - The current password of the user (optional).
 * @param {string} payload.newPassword - The new password to be set.
 * @returns {Promise<ResetPasswordResponse | ResetPasswordError>} - Resolves with the reset password result or error.
 */
export const resetPasswordThunk = createAsyncThunk<
  ResetPasswordResponse,
  { currentPassword: string | null; newPassword: string },
  { rejectValue: ResetPasswordError }
>(
  'auth/resetPassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      return await resetPasswordService.resetPassword(currentPassword, newPassword);
    } catch (error: any) {
      console.error('Thunk Error:', error);
      
      if (
        error?.message &&
        error?.status &&
        error?.type &&
        error?.code &&
        typeof error.isExpected === 'boolean'
      ) {
        return rejectWithValue(error as ResetPasswordError); // Reject structured error
      }
      
      // Fallback for unexpected error structures
      return rejectWithValue({
        message: error.message || 'An unexpected error occurred',
        status: 500,
        type: 'UnknownError',
        code: 'UNKNOWN_ERROR',
        isExpected: false,
        details: [],
      } as ResetPasswordError);
    }
  }
);
