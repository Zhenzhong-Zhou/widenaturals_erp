import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError, ErrorType } from '@utils/AppError';
import { withRetry } from '@utils/retryUtils';
import { withTimeout } from '@utils/timeoutUtils';
import type {
  ResetPasswordError,
  ResetPasswordResponse,
} from '@features/resetPassword/state/resetPasswordTypes';

/**
 * Reset Password API Service
 * Sends a request to reset the user's password with retry and timeout mechanisms.
 *
 * @param {string} currentPassword - The current password of the user (optional).
 * @param {string} newPassword - The new password to be set.
 * @returns {Promise<ResetPasswordResponse>} - Resolves with the reset password result.
 * @throws {ResetPasswordError} - Returns structured error details if the request fails.
 */
const resetPassword = async (
  currentPassword: string | null,
  newPassword: string
): Promise<ResetPasswordResponse> => {
  const payload = { currentPassword, newPassword };

  try {
    const response = await withRetry(
      async () =>
        withTimeout(
          axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, payload),
          5000, // 5 seconds timeout
          'Request timed out while resetting password.'
        ),
      3, // Number of retries
      1000, // Delay between retries (in ms)
      'Failed to reset password after multiple attempts.'
    );

    const { data, status } = response;

    if (status === 200) {
      return {
        success: true,
        message: data.message,
      };
    } else {
      throw new AppError(`Unexpected response status: ${status}`, 500, {
        type: ErrorType.GeneralError,
      });
    }
  } catch (error: any) {
    if (error.response?.data) {
      // Extract error details from API response
      throw {
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        type: error.response.data.type || 'UnknownError',
        code: error.response.data.code || 'UNKNOWN_ERROR',
        isExpected: error.response.data.isExpected || false,
        details: error.response.data.details || [],
      } as ResetPasswordError;
    }

    // Fallback for unexpected or network errors
    throw {
      message: error.message || 'A network error occurred',
      status: 500,
      type: 'NetworkError',
      code: 'NETWORK_ERROR',
      isExpected: false,
      details: [],
    } as ResetPasswordError;
  }
};

export const resetPasswordService = {
  resetPassword,
};
