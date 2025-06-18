import qs from 'qs';
import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  InventoryActivityLogBaseDataResponse,
  InventoryActivityLogPaginatedResponse,
  InventoryActivityLogQueryParams,
} from '@features/report/state';

/**
 * Fetches the base (non-paginated) inventory activity logs.
 * Typically used for standard users with access to general inventory log data.
 *
 * @returns A promise resolving to an array of inventory activity log entries
 *          wrapped in a success response structure.
 * @throws If the API request fails, the error will be propagated for higher-level handling.
 */
const fetchBaseInventoryActivityLogs = async (): Promise<InventoryActivityLogBaseDataResponse> => {
  try {
    const response = await axiosInstance.get<InventoryActivityLogBaseDataResponse>(
      API_ENDPOINTS.REPORTS.INVENTORY_ACTIVITY_LOGS
    );
    return response.data;
  } catch (error) {
    // Optional: You can log the error here if not handled globally
    // console.error('Failed to fetch base inventory activity logs', error);
    throw error;
  }
};

/**
 * Fetches a paginated list of inventory activity logs based on query filters.
 *
 * @param params - Query parameters including filters and pagination options
 * @returns A paginated response containing inventory activity log entries
 * @throws Error if the request fails
 */
const fetchPaginatedInventoryActivityLogs = async (
  params: InventoryActivityLogQueryParams
): Promise<InventoryActivityLogPaginatedResponse> => {
  try {
    const response = await axiosInstance.get<InventoryActivityLogPaginatedResponse>(
      API_ENDPOINTS.REPORTS.INVENTORY_ACTIVITY_LOGS,
      {
        params,
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: 'repeat' }) // <-- key part
      }
    );
    return response.data;
  } catch (error) {
    // Optionally handle/log error or throw for higher-level catch
    throw error;
  }
};

// Export the service object
export const reportService = {
  fetchBaseInventoryActivityLogs,
  fetchPaginatedInventoryActivityLogs,
};
