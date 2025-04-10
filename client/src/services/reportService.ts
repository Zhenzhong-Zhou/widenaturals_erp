import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import {
  AdjustmentReportParams,
  InventoryHistoryResponse,
  InventoryActivityLogParams,
  InventoryActivityLogsResponse,
  PaginatedAdjustmentReportResponse,
  InventoryHistoryParams,
} from '@features/report';
import { AppError } from '@utils/AppError';
import { isCustomAxiosError } from '@utils/axiosUtils';

/**
 * Fetch adjustment report (paginated, for UI).
 */
export const fetchAdjustmentReport = async (
  params: Partial<AdjustmentReportParams>
): Promise<PaginatedAdjustmentReportResponse> => {
  try {
    const response = await axiosInstance.get(
      API_ENDPOINTS.WAREHOUSE_INVENTORY_ADJUSTMENTS_REPORT,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching adjustment report:', error);
    throw new AppError('Failed to fetch adjustment report');
  }
};

/**
 * Export adjustment report (returns a downloadable file in CSV, PDF, or TXT format).
 */
export const exportAdjustmentReport = async (
  params: Partial<AdjustmentReportParams>
): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(
      API_ENDPOINTS.WAREHOUSE_INVENTORY_ADJUSTMENTS_REPORT,
      {
        params,
        responseType: 'blob',
      }
    );

    // Validate response MIME type based on export format
    const contentType = response.headers['content-type'];
    if (
      !contentType.includes('pdf') &&
      !contentType.includes('csv') &&
      !contentType.includes('plain')
    ) {
      console.error('Invalid content type:', contentType);
      throw new AppError(
        'Received invalid file format. Expected CSV, PDF, or TXT.'
      );
    }

    return response.data;
  } catch (error) {
    console.error('Error exporting adjustment report:', error);
    throw new AppError('Failed to export adjustment report');
  }
};

/**
 * Fetches inventory activity logs based on given parameters.
 *
 * @param {Partial<InventoryActivityLogParams>} params - Query parameters for filtering logs.
 * @returns {Promise<InventoryActivityLogsResponse>} - A promise resolving to the fetched logs.
 * @throws {AppError} - Throws an error if the request fails.
 */
export const fetchInventoryActivityLogs = async (
  params: Partial<InventoryActivityLogParams>
): Promise<InventoryActivityLogsResponse> => {
  try {
    const response = await axiosInstance.get(
      API_ENDPOINTS.WAREHOUSE_INVENTORY_ACTIVITY_LOGS,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory activity logs:', error);
    throw new AppError('Failed to fetch inventory activity logs');
  }
};

/**
 * Exports inventory activity logs as a file (CSV, PDF, or TXT).
 *
 * @param {Partial<InventoryActivityLogParams>} params - Query parameters for filtering logs.
 * @returns {Promise<Blob>} - A promise resolving to the exported file as a Blob.
 * @throws {AppError} - Throws an error if the request fails or receives an invalid format.
 */
export const exportInventoryActivityLogs = async (
  params: Partial<InventoryActivityLogParams>
): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(
      API_ENDPOINTS.WAREHOUSE_INVENTORY_ACTIVITY_LOGS,
      {
        params,
        responseType: 'blob',
      }
    );

    // Validate response MIME type based on export format
    const contentType = response.headers['content-type'];
    if (
      !contentType.includes('pdf') &&
      !contentType.includes('csv') &&
      !contentType.includes('plain')
    ) {
      console.error('Invalid content type:', contentType);
      throw new AppError(
        'Received invalid file format. Expected CSV, PDF, or TXT.'
      );
    }

    return response.data;
  } catch (error) {
    console.error('Error exporting inventory activity logs:', error);
    throw new AppError('Failed to export inventory activity logs');
  }
};

/**
 * Fetches inventory history based on given parameters.
 *
 * @param {Partial<InventoryActivityLogParams>} params - Query parameters for filtering logs.
 * @returns {Promise<InventoryActivityLogsResponse>} - A promise resolving to the fetched logs.
 * @throws {AppError} - Throws an error if the request fails.
 */
export const fetchInventoryHistory = async (
  params: Partial<InventoryHistoryParams>
): Promise<InventoryHistoryResponse> => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.INVENTORY_HISTORY, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    if (isCustomAxiosError(error)) {
      throw new AppError('Failed to fetch inventory history');
    }
    throw new AppError(
      'An unexpected error occurred while fetching inventory history.'
    );
  }
};

/**
 * Exports inventory history as a file (CSV, PDF, or TXT).
 *
 * @param {Partial<InventoryActivityLogParams>} params - Query parameters for filtering logs.
 * @returns {Promise<Blob>} - A promise resolving to the exported file as a Blob.
 * @throws {AppError} - Throws an error if the request fails or receives an invalid format.
 */
export const exportInventoryHistory = async (
  params: Partial<InventoryHistoryParams>
): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.INVENTORY_HISTORY, {
      params,
      responseType: 'blob',
    });

    // Validate response MIME type based on export format
    const contentType = response.headers['content-type'];
    if (
      !contentType.includes('pdf') &&
      !contentType.includes('csv') &&
      !contentType.includes('plain')
    ) {
      console.error('Invalid content type:', contentType);
      throw new AppError(
        'Received invalid file format. Expected CSV, PDF, or TXT.'
      );
    }

    return response.data;
  } catch (error) {
    console.error('Error exporting inventory history:', error);

    if (isCustomAxiosError(error)) {
      throw new AppError('Failed to export inventory history');
    }

    throw new AppError(
      'An unexpected error occurred while exporting inventory history.'
    );
  }
};

// Export the service object
export const reportService = {
  fetchAdjustmentReport,
  exportAdjustmentReport,
  fetchInventoryActivityLogs,
  exportInventoryActivityLogs,
  fetchInventoryHistory,
  exportInventoryHistory,
};
