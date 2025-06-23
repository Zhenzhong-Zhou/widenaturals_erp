import axiosInstance from '@utils/axiosConfig';

/**
 * Generic wrapper for sending POST requests.
 *
 * Reduces redundancy by abstracting axios POST logic.
 * Type-safe request and response interfaces for better DX.
 *
 * @template T - Request payload type
 * @template R - Expected response type
 * @param {string} url - Endpoint URL
 * @param {T} data - Payload to send
 * @returns {Promise<R>} - Parsed response data
 * @throws {Error} - Axios error if request fails
 */
export const postRequest = async <T, R>(url: string, data: T): Promise<R> => {
  const response = await axiosInstance.post<R>(url, data);
  return response.data;
};

/**
 * Generic wrapper for sending GET requests.
 *
 * Simplifies axios GET usage with typed response handling.
 *
 * @template R - Expected response type
 * @param {string} url - The endpoint to fetch data from
 * @returns {Promise<R>} - Parsed response data of type R
 * @throws {Error} - If the request fails
 */
export const getRequest = async <R>(url: string): Promise<R> => {
  const response = await axiosInstance.get<R>(url);
  return response.data;
};

/**
 * Generic wrapper for sending PUT requests.
 *
 * Simplifies axios PUT usage with typed payload and response handling.
 *
 * @template T - Request payload type
 * @template R - Expected response type
 * @param {string} url - The endpoint to send the update to
 * @param {T} data - Payload to be sent in the PUT request
 * @returns {Promise<R>} - Parsed response data of type R
 * @throws {Error} - If the request fails
 */
export const putRequest = async <T, R>(url: string, data: T): Promise<R> => {
  const response = await axiosInstance.put<R>(url, data);
  return response.data;
};
