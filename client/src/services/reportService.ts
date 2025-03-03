import { AdjustmentReportParams, PaginatedAdjustmentReportResponse } from '../features/report';
import { API_ENDPOINTS } from './apiEndponits.ts';
import axiosInstance from '@utils/axiosConfig';
import { AppError } from '@utils/AppError';

/**
 * Fetch warehouse inventory adjustments report.
 *
 * @param {AdjustmentReportParams} params - Parameters for the report request.
 * @returns {Promise<PaginatedAdjustmentReportResponse>} - The fetched report data.
 */
const fetchAdjustmentReport = async ({
                                       reportType = 'daily',
                                       userTimezone = 'UTC',
                                       startDate,
                                       endDate,
                                       warehouseId,
                                       inventoryId,
                                       page = 1,
                                       limit = 50,
                                       exportFormat
                                     }: Partial<AdjustmentReportParams>): Promise<PaginatedAdjustmentReportResponse> => {
  try {
    // Ensure the correct API endpoint
    const endpoint = API_ENDPOINTS.WAREHOUSE_INVENTORY_ADJUSTMENTS_REPORT;
    
    // Attach query parameters
    const response = await axiosInstance.get(endpoint, {
      params: {
        reportType,
        userTimezone,
        startDate,
        endDate,
        warehouseId,
        inventoryId,
        page,
        limit,
        exportFormat
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching adjustment report:', error);
    throw new AppError('Failed to fetch adjustment report');
  }
};

// Export the service object
export const reportService = {
  fetchAdjustmentReport
};
