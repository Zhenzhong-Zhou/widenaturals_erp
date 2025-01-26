import { AxiosError } from 'axios';

/**
 * Type guard to check if an error is an AxiosError.
 *
 * @param error - The error to check.
 * @returns True if the error is an AxiosError, false otherwise.
 */
export const isCustomAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError).isAxiosError !== undefined;
};
