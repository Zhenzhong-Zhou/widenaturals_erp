import qs from 'qs';
import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  InventoryActivityLogBaseDataResponse,
  InventoryActivityLogPaginatedResponse,
  InventoryActivityLogQueryParams,
} from '@features/report/state';
import type { PaginationParams } from '@shared-types/api';

/**
 * Fetches the base (non-paginated) inventory activity logs.
 * Typically used for standard users with access to general inventory log data.
 *
 * @param params - Pagination parameters; only `limit` is used, page is fixed at 1.
 * @returns A promise resolving to an array of inventory activity log entries
 *          wrapped in a success response structure.
 * @throws If the API request fails, the error will be propagated for higher-level handling.
 */
const fetchBaseInventoryActivityLogs = async (
  params: Omit<PaginationParams, 'page'> // accept limit only
): Promise<InventoryActivityLogBaseDataResponse> => {
  try {
    const response = await axiosInstance.get<InventoryActivityLogBaseDataResponse>(
      API_ENDPOINTS.REPORTS.INVENTORY_ACTIVITY_LOGS,
      {
        params: {
          page: 1,
          limit: params.limit,
        },
      }
    );
    return response.data;
  } catch (error) {
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
