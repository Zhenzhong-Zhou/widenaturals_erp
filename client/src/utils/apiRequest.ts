import axiosInstance from '@utils/axiosConfig';
import type { AxiosRequestConfig } from 'axios';

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
 * Sends a typed HTTP GET request using Axios with optional configuration.
 *
 * This utility simplifies GET requests by allowing typed response handling
 * and optional Axios config such as query parameters, headers, etc.
 *
 * @template R - The expected shape of the response data
 * @param {string} url - The URL endpoint to send the GET request to
 * @param {import('axios').AxiosRequestConfig} [config] - Optional Axios config object (e.g., params, headers)
 * @returns {Promise<R>} - A promise resolving to the typed response data
 * @throws {Error} - If the HTTP request fails or the response is invalid
 */
export const getRequest = async <R>(
  url: string,
  config?: AxiosRequestConfig
): Promise<R> => {
  const response = await axiosInstance.get<R>(url, config);
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
