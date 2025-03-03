import { AdjustmentReportParams, PaginatedAdjustmentReportResponse } from '../features/report';
import { API_ENDPOINTS } from './apiEndponits.ts';
import axiosInstance from '@utils/axiosConfig';
import { AppError } from '@utils/AppError';

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
    if (!contentType.includes('pdf') && !contentType.includes('csv') && !contentType.includes('plain')) {
      console.error('Invalid content type:', contentType);
      throw new AppError('Received invalid file format. Expected CSV, PDF, or TXT.');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error exporting adjustment report:', error);
    throw new AppError('Failed to export adjustment report');
  }
};

// Export the service object
export const reportService = {
  fetchAdjustmentReport,
  exportAdjustmentReport
};
