import { WritePolicy } from '@utils/http';
import { AxiosRequestConfig } from 'axios';
import { requestWithNamedPolicy } from '@utils/http';
import axiosInstance from '@utils/axiosConfig';
import { mapHttpError } from '@utils/error';

export interface PatchRequestOptions {
  /**
   * Transport policy to apply.
   * Defaults to WRITE.
   */
  policy?: WritePolicy;
  
  /**
   * Optional Axios request configuration.
   */
  config?: AxiosRequestConfig;
}

/**
 * Executes a typed HTTP PATCH request with a named transport policy.
 *
 * Behavior:
 * - PATCH requests are non-idempotent and use WRITE-based policies.
 * - Timeout and retry behavior are enforced by the selected policy.
 * - AbortController cancellation is supported via Axios `signal`.
 * - All transport-level and HTTP errors are normalized into `AppError`.
 *
 * @typeParam T - Request payload type.
 * @typeParam R - Expected response payload type.
 *
 * @param url - Fully resolved API endpoint URL.
 * @param data - Payload to send in the request body.
 * @param options - Transport policy and Axios configuration.
 *
 * @returns A promise resolving to the typed response payload.
 *
 * @throws {AppError}
 * Always throws a normalized `AppError` when the request fails.
 */
export const patchRequest = async <T, R>(
  url: string,
  data: T,
  options: PatchRequestOptions = {}
): Promise<R> => {
  const { policy = 'WRITE', config } = options;
  
  try {
    const response = await requestWithNamedPolicy(
      (signal) =>
        axiosInstance.patch<R>(url, data, {
          ...config,
          signal,
        }),
      policy
    );
    
    return response.data;
  } catch (error: unknown) {
    throw mapHttpError(error);
  }
};
