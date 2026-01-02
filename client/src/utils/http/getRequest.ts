import type { ReadPolicy } from '@utils/http';
import { AxiosRequestConfig } from 'axios';
import { requestWithNamedPolicy } from '@utils/http';
import axiosInstance from '@utils/axiosConfig';
import { mapHttpError } from '@utils/error';

export interface GetRequestOptions {
  /**
   * Transport policy to apply.
   *
   * Expresses semantic intent only (e.g. READ, CRITICAL).
   * Retry and timeout behavior are defined by the selected policy.
   *
   * Defaults to READ.
   */
  policy?: ReadPolicy;

  /**
   * Optional Axios request configuration.
   *
   * Use this to override request-specific settings such as
   * headers, credentials, or timeouts.
   */
  config?: AxiosRequestConfig;
}

/**
 * Executes a typed HTTP GET request with a named transport policy.
 *
 * Behavior:
 * - GET requests are idempotent and may be retried depending on policy.
 * - Timeout and retry behavior are enforced by the selected policy.
 * - AbortController cancellation is supported via Axios `signal`.
 * - All transport-level and HTTP errors are normalized into `AppError`.
 *
 * @typeParam R - Expected response payload type.
 *
 * @param url - Fully resolved API endpoint URL.
 * @param options - Transport policy and Axios configuration.
 *
 * @returns A promise resolving to the typed response payload.
 *
 * @throws {AppError}
 * Always throws a normalized `AppError` when the request fails.
 */
export const getRequest = async <R>(
  url: string,
  options: GetRequestOptions = {}
): Promise<R> => {
  const { policy = 'READ', config } = options;

  try {
    const response = await requestWithNamedPolicy(
      (signal) =>
        axiosInstance.get<R>(url, {
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
