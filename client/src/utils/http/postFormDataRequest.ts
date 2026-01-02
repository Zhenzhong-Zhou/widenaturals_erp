import { WritePolicy } from '@utils/http';
import { AxiosRequestConfig } from 'axios';
import { requestWithNamedPolicy } from '@utils/http';
import axiosInstance from '@utils/axiosConfig';
import { mapHttpError } from '@utils/error';

export interface PostFormDataRequestOptions {
  /**
   * Transport policy to apply.
   * Defaults to WRITE.
   */
  policy?: WritePolicy;

  /**
   * Optional Axios request configuration.
   *
   * NOTE:
   * - Do NOT set Content-Type manually for multipart/form-data.
   * - Axios will inject the correct boundary automatically.
   */
  config?: AxiosRequestConfig;
}

/**
 * Executes a multipart/form-data POST request with a named transport policy.
 *
 * Behavior:
 * - Designed for file uploads and mixed payloads (files + JSON fields).
 * - Uses WRITE-based transport policies by default.
 * - Supports extended timeouts via Axios config when needed.
 * - AbortController cancellation is supported via Axios `signal`.
 * - All transport-level and HTTP errors are normalized into `AppError`.
 *
 * @typeParam R - Expected response payload type.
 *
 * @param url - Fully resolved API endpoint URL.
 * @param formData - FormData containing file blobs and metadata.
 * @param options - Transport policy and Axios configuration.
 *
 * @returns A promise resolving to the typed response payload.
 *
 * @throws {AppError}
 * Always throws a normalized `AppError` when the request fails.
 */
export const postFormDataRequest = async <R>(
  url: string,
  formData: FormData,
  options: PostFormDataRequestOptions = {}
): Promise<R> => {
  const { policy = 'WRITE', config } = options;

  try {
    const response = await requestWithNamedPolicy(
      (signal) =>
        axiosInstance.post<R>(url, formData, {
          ...config,
          signal,
          // IMPORTANT: Do NOT set Content-Type manually
          headers: {
            ...config?.headers,
            'Content-Type': undefined,
          },
        }),
      policy
    );

    return response.data;
  } catch (error: unknown) {
    throw mapHttpError(error);
  }
};
