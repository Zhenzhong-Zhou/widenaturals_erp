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
      console.log(error);
      if (error.response?.data) {
        console.log('[Validation Error Response]', error.response.data); // Log the full error response
        return rejectWithValue(error.response.data); // Reject with the detailed error response
      }
      // Log unexpected errors
      console.error('[Unexpected Error]', error);
      throw error;
    }
  }
);
